import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { api, http, errorMessage } from "../api/client";
import { keys, queryClient } from "./query";
import { useRealtime } from "../realtime/useRealtime";
type Notice = { text: string; kind: "info" | "error" };
const Notifications = createContext<
  (message: string, kind?: Notice["kind"]) => void
>(() => {});
export function useNotify() {
  return useContext(Notifications);
}
export function useSession() {
  return useQuery({
    queryKey: keys.session,
    queryFn: ({ signal }) => api.session(signal),
    staleTime: 10000,
    refetchInterval: 15000,
  });
}
export function Providers({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<Notice | null>(null);
  const notify = useCallback(
    (text: string, kind: Notice["kind"] = "info") => setMessage({ text, kind }),
    [],
  );
  useEffect(() => {
    if (!message) return;
    const duration = message.kind === "error" ? 8000 : 5000;
    const timer = setTimeout(() => setMessage(null), duration);
    return () => clearTimeout(timer);
  }, [message]);
  useEffect(
    () =>
      queryClient.getMutationCache().subscribe((event) => {
        if (
          event.type === "updated" &&
          event.action.type === "error" &&
          !event.mutation.options.meta?.errorHandledLocally
        ) {
          notify(errorMessage(event.mutation.state.error), "error");
        }
      }),
    [notify],
  );
  useEffect(() => {
    const interceptor = http.interceptors.response.use(
      (r) => r,
      (error) => {
        if (error.response?.status === 401)
          void queryClient.invalidateQueries({ queryKey: keys.session });
        return Promise.reject(error);
      },
    );
    return () => http.interceptors.response.eject(interceptor);
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <Notifications.Provider value={notify}>
        <LiveConnection />
        {children}
        <div
          data-notification
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={
            message
              ? "fixed bottom-24 md:bottom-5 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 pointer-events-none rounded border border-primary/30 bg-surface-card px-5 py-4 pr-24 text-sm shadow-xl"
              : "sr-only"
          }
        >
          {message?.kind === "error" && (
            <span className="mb-1 block font-bold text-red-200">
              Ação não concluída
            </span>
          )}
          {message?.text}
          {message && (
            <button
              type="button"
              aria-label="Fechar notificação"
              className="pointer-events-auto absolute right-3 top-3 rounded p-1 underline"
              onPointerDown={(event) => {
                // Keep focus inside an open modal and avoid its outside-click dismissal.
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();
                setMessage(null);
              }}
            >
              Fechar
            </button>
          )}
        </div>
      </Notifications.Provider>
    </QueryClientProvider>
  );
}
function LiveConnection() {
  const session = useSession();
  useRealtime(session.data?.user?.id, !session.isPending);
  return null;
}
