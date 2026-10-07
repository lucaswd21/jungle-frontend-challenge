import { QueryClient } from "@tanstack/react-query";
import axios from "axios";
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15000,
      gcTime: 5 * 60 * 1000,
      retry: (count, error) =>
        count < 1 &&
        !(
          axios.isAxiosError(error) &&
          error.response &&
          error.response.status < 500
        ),
      refetchOnWindowFocus: true,
    },
    mutations: { retry: false },
  },
});
export const keys = {
  session: ["session"] as const,
  cart: (userId?: string) => ["cart", userId ?? "guest"] as const,
  quote: (userId?: string) => ["quote", userId ?? "guest"] as const,
  favorites: (userId?: string) => ["favorites", userId] as const,
  wallets: (userId?: string) => ["wallets", userId] as const,
  profile: (userId?: string) => ["profile", userId] as const,
  order: (userId: string | undefined, id: string) =>
    ["order", userId, id] as const,
};
