import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errorMessage } from "../api/client";
import type { CartItem } from "../api/contracts";
import { keys } from "../app/query";
import { useNotify, useSession } from "../app/providers";
export function useCart() {
  const session = useSession();
  const user = session.data?.user;
  return useQuery({
    queryKey: keys.cart(user?.id),
    queryFn: ({ signal }) => api.cart(signal),
    enabled: session.isSuccess,
  });
}
export function useQuote() {
  const session = useSession();
  const user = session.data?.user;
  return useQuery({
    queryKey: keys.quote(user?.id),
    queryFn: ({ signal }) => api.quote(signal),
    enabled: session.isSuccess,
  });
}
export function useWallets() {
  const user = useSession().data?.user;
  return useQuery({
    queryKey: keys.wallets(user?.id),
    queryFn: ({ signal }) => api.wallets(signal),
    enabled: !!user,
  });
}
export function useCartAction(action: "add" | "quantity" | "remove") {
  const client = useQueryClient();
  const user = useSession().data?.user;
  const notify = useNotify();
  return useMutation({
    mutationFn: (item: CartItem) => api[action](item),
    onSuccess(cart) {
      client.setQueryData(keys.cart(user?.id), cart);
      void client.invalidateQueries({ queryKey: keys.quote(user?.id) });
      notify(
        action === "add"
          ? "NFT adicionado ao carrinho."
          : action === "remove"
            ? "NFT removido do carrinho."
            : "Carrinho atualizado.",
      );
    },
    onError(error) {
      notify(errorMessage(error));
    },
  });
}
export function useFavorite() {
  const user = useSession().data?.user;
  const client = useQueryClient();
  const notify = useNotify();
  const key = keys.favorites(user?.id);
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => api.favorites(signal),
    enabled: !!user,
  });
  const mutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.favorite(id, active),
    async onMutate({ id, active }) {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<string[]>(key) ?? [];
      client.setQueryData(
        key,
        active
          ? [...new Set([...previous, id])]
          : previous.filter((n) => n !== id),
      );
      return { previous };
    },
    onError(error, _variables, context) {
      client.setQueryData(key, context?.previous);
      notify(errorMessage(error));
    },
    onSuccess(data) {
      client.setQueryData(key, data);
      notify("Favoritos atualizados.");
    },
    onSettled() {
      void client.invalidateQueries({ queryKey: key });
    },
  });
  return { query, mutation, user };
}
