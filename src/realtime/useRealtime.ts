import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Socket } from "socket.io-client";
import type {
  Nft,
  NftEvent,
  Order,
  OrderEvent,
  ResourceEvent,
} from "../api/contracts";
import { keys } from "../app/query";
import { useNotify } from "../app/providers";
export function useRealtime(userId?: string, enabled = true) {
  const client = useQueryClient();
  const notify = useNotify();
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const versions = new Map<string, number>();
    const events = new Set<string>();
    let socket: Socket | undefined;
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    function accept(type: string, event: ResourceEvent) {
      if (
        !active ||
        (event.userId && event.userId !== userId) ||
        events.has(event.eventId)
      )
        return false;
      const key = `${type}:${event.resourceId}`;
      if (event.version <= (versions.get(key) ?? 0)) return false;
      versions.set(key, event.version);
      events.add(event.eventId);
      return true;
    }
    function reconcile() {
      if (!active) return;
      void client.invalidateQueries({ queryKey: ["catalog"] });
      void client.invalidateQueries({ queryKey: ["nft"] });
      void client.invalidateQueries({ queryKey: keys.cart(userId) });
      void client.invalidateQueries({ queryKey: keys.quote(userId) });
      if (userId)
        void client.invalidateQueries({ queryKey: ["order", userId] });
    }
    async function connect() {
      try {
        // MSW is already active. Fetch the client after the first render instead of blocking it.
        const { io } = await import("socket.io-client");
        if (!active) return;
        const connection = io("https://realtime.jungle.test", {
          transports: ["websocket"],
          reconnectionDelay: 300,
          reconnectionDelayMax: 1000,
        });
        socket = connection;
        connection.on("connect", reconcile);
        connection.on("nft.updated", (event: NftEvent) => {
          if (!accept("nft", event)) return;
          client.setQueryData<Nft>(["nft", event.resourceId], (old) =>
            !old || old.version < event.version ? event.nft : old,
          );
          void client.invalidateQueries({ queryKey: ["catalog"] });
          void client.invalidateQueries({ queryKey: keys.quote(userId) });
          notify(
            "Preço ou disponibilidade atualizados. Revise o carrinho antes de confirmar o pagamento.",
          );
        });
        connection.on("order.updated", (event: OrderEvent) => {
          if (!accept("order", event)) return;
          client.setQueryData<Order>(
            keys.order(userId, event.resourceId),
            (old) =>
              old && (old.version >= event.version || old.status !== "pending")
                ? old
                : event.order,
          );
          void client.invalidateQueries({ queryKey: keys.cart(userId) });
          void client.invalidateQueries({ queryKey: keys.quote(userId) });
          notify(
            event.order.status === "confirmed"
              ? "Seu pedido simulado foi confirmado."
              : "Seu pagamento simulado foi recusado. O carrinho foi preservado.",
          );
        });
        connection.on("disconnect", () => {
          if (active)
            notify(
              "Conexão em tempo real interrompida. Os dados serão atualizados quando a conexão voltar.",
            );
        });
      } catch {
        if (active)
          notify(
            "Atualizações em tempo real indisponíveis. Você pode continuar navegando e recarregar para reconectar.",
          );
      }
    }
    if ("requestIdleCallback" in window) {
      idle = window.requestIdleCallback(() => void connect(), {
        timeout: 1000,
      });
    } else {
      timer = setTimeout(() => void connect(), 0);
    }
    return () => {
      active = false;
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer !== undefined) clearTimeout(timer);
      socket?.removeAllListeners();
      socket?.disconnect();
    };
  }, [client, userId, notify, enabled]);
}
