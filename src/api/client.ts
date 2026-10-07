import axios from "axios";
import { recoverMockTransport, waitForMockTransport } from "./mockRecovery";
import type {
  ApiError,
  Cart,
  CartItem,
  CatalogSearch,
  CheckoutInput,
  Nft,
  Order,
  Page,
  Quote,
  Scenario,
  Session,
  User,
  Wallet,
} from "./contracts";
export const http = axios.create({ baseURL: "/api", timeout: 7000 });
// A deployment fallback can return index.html with HTTP 200. Never cache it as API data.
http.interceptors.response.use(async (response) => {
  if (!String(response.headers["content-type"]).includes("application/json")) {
    const config = response.config as typeof response.config & {
      mockRecoveryAttempted?: boolean;
    };
    if (!config.mockRecoveryAttempted) {
      const recovered = await recoverMockTransport();
      // Never replay writes: the server may have already accepted the action.
      if (recovered && config.method?.toLowerCase() === "get") {
        config.mockRecoveryAttempted = true;
        return http.request(config);
      }
    }
    throw new Error(
      "Não foi possível recuperar a conexão. Tente novamente em instantes.",
    );
  }
  return response;
});
http.interceptors.request.use(async (config) => {
  await waitForMockTransport(
    !["get", "head", "options"].includes(config.method?.toLowerCase() ?? "get"),
  );
  const token = localStorage.getItem("jungle.session.token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export function errorMessage(error: unknown) {
  if (axios.isAxiosError<ApiError>(error))
    return (
      error.response?.data.message ??
      (error.code === "ECONNABORTED"
        ? "A solicitação demorou demais. Você pode tentar novamente com segurança."
        : "Não foi possível conectar. Tente novamente.")
    );
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a ação. Tente novamente.";
}
export function fieldErrors(error: unknown) {
  return axios.isAxiosError<ApiError>(error)
    ? (error.response?.data.fields ?? {})
    : {};
}
const get = async <T>(url: string, signal?: AbortSignal) =>
  (await http.get<T>(url, { signal })).data;
const post = async <T>(url: string, data?: unknown) =>
  (await http.post<T>(url, data)).data;
export const api = {
  session: (signal?: AbortSignal) => get<Session>("/session", signal),
  login: (data: { email: string; password: string }) =>
    post<Session>("/session", data),
  signup: (data: { name: string; email: string; password: string }) =>
    post<Session>("/accounts", data),
  logout: () => http.delete("/session"),
  catalog: (search: CatalogSearch, signal?: AbortSignal) =>
    get<Page<Nft>>(
      `/nfts?${new URLSearchParams(
        Object.entries(search)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)]),
      )}`,
      signal,
    ),
  nft: (id: string, signal?: AbortSignal) => get<Nft>(`/nfts/${id}`, signal),
  favorites: (signal?: AbortSignal) => get<string[]>("/favorites", signal),
  favorite: (id: string, active: boolean) =>
    post<string[]>("/favorites", { id, active }),
  cart: async (signal?: AbortSignal) => {
    const cart = await get<Cart>("/cart", signal);
    if (
      !Array.isArray(cart?.items) ||
      cart.items.some(
        (item) =>
          !item || !Number.isInteger(item.quantity) || item.quantity < 1,
      )
    )
      throw new Error("Não foi possível carregar o carrinho. Tente novamente.");
    return cart;
  },
  add: (item: CartItem) => post<Cart>("/cart/items", item),
  quantity: (item: CartItem) =>
    http.patch<Cart>("/cart/items", item).then((r) => r.data),
  remove: (item: CartItem) =>
    http.delete<Cart>("/cart/items", { data: item }).then((r) => r.data),
  coupon: (code: string) => post<Quote>("/quote/coupon", { code }),
  quote: (signal?: AbortSignal) => get<Quote>("/quote", signal),
  order: (input: CheckoutInput, key: string) =>
    http
      .post<Order>("/orders", input, { headers: { "Idempotency-Key": key } })
      .then((r) => r.data),
  recoverOrder: (key: string) => get<Order>(`/orders/attempt/${key}`),
  getOrder: (id: string, signal?: AbortSignal) =>
    get<Order>(`/orders/${id}`, signal),
  profile: (signal?: AbortSignal) => get<User>("/profile", signal),
  updateProfile: (
    data: Pick<
      User,
      "name" | "email" | "avatar" | "bio" | "username" | "ens" | "walletAlias"
    >,
  ) => http.patch<User>("/profile", data).then((r) => r.data),
  password: (data: { current: string; password: string }) =>
    post<{ ok: boolean }>("/profile/password", data),
  wallets: (signal?: AbortSignal) => get<Wallet[]>("/wallets", signal),
  connectWallet: (id: string, network: string, approve: boolean) =>
    post<{ connected: boolean }>(`/wallets/${id}/connect`, {
      network,
      approve,
    }),
  saveWallet: (data: Omit<Wallet, "id"> & { id?: string }) =>
    post<Wallet[]>("/wallets", data),
  scenario: (scenario: Scenario) =>
    post<{ scenario: Scenario }>("/demo/scenario", { scenario }),
  reset: () => post<{ ok: boolean }>("/demo/reset"),
  event: (kind: string) => post<{ ok: boolean }>("/demo/event", { kind }),
};
