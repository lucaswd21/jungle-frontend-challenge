import {
  createRootRoute,
  lazyRouteComponent,
  createRoute,
  createRouter,
  redirect,
  type SearchSchemaInput,
} from "@tanstack/react-router";
import { Layout } from "./Layout";
import { Catalog } from "../features/Catalog";
import { api } from "../api/client";
import { queryClient, keys } from "./query";
import type { CatalogSearch } from "../api/contracts";
// Page code is fetched when its route is opened; guards stay eager.
const Detail = lazyRouteComponent(() => import("../features/Detail"), "Detail");
const CartPage = lazyRouteComponent(
  () => import("../features/Cart"),
  "CartPage",
);
const AuthPage = lazyRouteComponent(
  () => import("../features/Auth"),
  "AuthPage",
);
const Checkout = lazyRouteComponent(
  () => import("../features/Checkout"),
  "Checkout",
);
const OrderPage = lazyRouteComponent(
  () => import("../features/Order"),
  "OrderPage",
);
const ProfilePage = lazyRouteComponent(
  () => import("../features/Account"),
  "ProfilePage",
);
const WalletsPage = lazyRouteComponent(
  () => import("../features/Account"),
  "WalletsPage",
);
export function validateCatalogSearch(
  raw: Partial<CatalogSearch> & SearchSchemaInput,
): CatalogSearch {
  const price = (value: unknown) =>
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 10000
      ? Number(value.toFixed(2))
      : undefined;
  return {
    view: raw.view === "new" || raw.view === "trending" ? raw.view : undefined,
    min: price(raw.min),
    max: price(raw.max),
    network: ["Ethereum", "Polygon", "Solana"].includes(String(raw.network))
      ? String(raw.network)
      : undefined,
    q: typeof raw.q === "string" ? raw.q.slice(0, 120) : "",
    category: ["Art", "Photography", "Collectibles"].includes(
      String(raw.category),
    )
      ? String(raw.category)
      : "",
    sort: ["price-asc", "price-desc"].includes(String(raw.sort))
      ? (raw.sort as CatalogSearch["sort"])
      : "featured",
    page: Math.max(1, Math.min(100, Number(raw.page) || 1)),
  };
}
const root = createRootRoute({
  component: Layout,
  notFoundComponent: () => (
    <div className="panel">
      <h1 className="text-3xl">Página não encontrada</h1>
      <a href="/" className="mt-4 inline-block underline">
        Voltar ao mercado
      </a>
    </div>
  ),
});
const catalog = createRoute({
  getParentRoute: () => root,
  path: "/",
  validateSearch: validateCatalogSearch,
  component: Catalog,
});
const detail = createRoute({
  getParentRoute: () => root,
  path: "/nfts/$nftId",
  component: Detail,
});
const cart = createRoute({
  getParentRoute: () => root,
  path: "/cart",
  component: CartPage,
});
const authSearch = (raw: { returnTo?: string } & SearchSchemaInput) => ({
  returnTo:
    typeof raw.returnTo === "string" &&
    raw.returnTo.startsWith("/") &&
    !raw.returnTo.startsWith("//") &&
    !raw.returnTo.includes("://")
      ? raw.returnTo
      : "/",
});
const login = createRoute({
  getParentRoute: () => root,
  path: "/login",
  validateSearch: authSearch,
  component: () => <AuthPage signup={false} />,
});
const signup = createRoute({
  getParentRoute: () => root,
  path: "/signup",
  validateSearch: authSearch,
  component: () => <AuthPage signup />,
});
async function requireAuth({ location }: { location: { href: string } }) {
  const session = await queryClient.fetchQuery({
    queryKey: keys.session,
    queryFn: () => api.session(),
    staleTime: 0,
  });
  if (!session.user)
    throw redirect({ to: "/login", search: { returnTo: location.href } });
}
const checkout = createRoute({
  getParentRoute: () => root,
  path: "/checkout",
  beforeLoad: requireAuth,
  component: Checkout,
});
const order = createRoute({
  getParentRoute: () => root,
  path: "/orders/$orderId",
  beforeLoad: requireAuth,
  component: OrderPage,
});
const profile = createRoute({
  getParentRoute: () => root,
  path: "/profile",
  beforeLoad: requireAuth,
  component: ProfilePage,
});
const wallets = createRoute({
  getParentRoute: () => root,
  path: "/wallets",
  beforeLoad: requireAuth,
  component: WalletsPage,
});
export const router = createRouter({
  routeTree: root.addChildren([
    catalog,
    detail,
    cart,
    login,
    signup,
    checkout,
    order,
    profile,
    wallets,
  ]),
  defaultPreload: "intent",
  defaultViewTransition: true,
  defaultPendingComponent: () => <p role="status">Carregando página…</p>,
  defaultErrorComponent: ({ error, reset }) => (
    <div role="alert" className="panel">
      <h1 className="text-2xl">Não foi possível abrir esta página</h1>
      <p>{error instanceof Error ? error.message : "Tente novamente."}</p>
      <button onClick={reset} className="mt-4 underline">
        Tentar novamente
      </button>
    </div>
  ),
});
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
