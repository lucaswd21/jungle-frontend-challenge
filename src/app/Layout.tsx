import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, FlaskConical, Menu } from "lucide-react";
import { AccountIcon } from "../components/AccountIcon";
import { FigmaIcon } from "../components/FigmaIcon";
import { useMobile } from "../lib/useMobile";
import { MarketFooter } from "../components/MarketFooter";
import { api, errorMessage } from "../api/client";
import { SCENARIOS, type Scenario } from "../api/contracts";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "../components/ui/dialog";
import { Select } from "../components/shared";
import { useCart } from "../features/hooks";
import { useNotify, useSession } from "./providers";
import { keys } from "./query";
import { useActiveSection } from "../lib/useActiveSection";
const AuthDialog = lazy(() =>
  import("../features/Auth").then((module) => ({ default: module.AuthDialog })),
);
const pageTitles: Record<string, string> = {
  "": "Mercado de NFTs",
  nfts: "Detalhes do NFT",
  cart: "Carrinho de NFTs",
  login: "Entrar",
  signup: "Criar conta",
  checkout: "Finalizar compra",
  orders: "Detalhes do pedido",
  profile: "Meu perfil",
  wallets: "Minhas carteiras",
};

export function Layout() {
  const mobile = useMobile();
  const session = useSession();
  const user = session.data?.user;
  const cart = useCart();
  const client = useQueryClient();
  const notify = useNotify();
  useEffect(() => {
    if (cart.error) notify(errorMessage(cart.error), "error");
  }, [cart.error, notify]);
  const navigate = useNavigate();
  const location = useRouterState({ select: (state) => state.location });
  const [authModal, setAuthModal] = useState<"login" | "signup" | null>(null);
  const activeSection = useActiveSection(location.pathname, location.hash);
  const previousUser = useRef<string | null | undefined>(undefined);
  const previousPath = useRef<string | undefined>(undefined);
  const intentionalLogout = useRef(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  useEffect(() => {
    const current = user?.id ?? null;
    if (
      previousUser.current !== undefined &&
      previousUser.current !== current
    ) {
      const previous = previousUser.current;
      void client.cancelQueries({
        predicate: (q) => q.queryKey[1] === previous,
      });
      client.removeQueries({
        predicate: (q) =>
          [
            "favorites",
            "profile",
            "wallets",
            "order",
            "cart",
            "quote",
          ].includes(String(q.queryKey[0])) && q.queryKey[1] === previous,
      });
    }
    previousUser.current = current;
    if (
      session.isSuccess &&
      !intentionalLogout.current &&
      !user &&
      /^\/(checkout|orders|profile|wallets)(\/|$)/.test(location.pathname)
    ) {
      notify("Sua sessão terminou. Entre para retomar seu progresso.");
      void navigate({ to: "/login", search: { returnTo: location.href } });
    }
  }, [
    user,
    session.isSuccess,
    location.pathname,
    location.href,
    client,
    notify,
    navigate,
  ]);
  useEffect(() => {
    const pageTitle =
      pageTitles[location.pathname.split("/")[1]] ?? "Página não encontrada";
    document.title = `${pageTitle} | Kurio`;
    if (
      previousPath.current !== undefined &&
      previousPath.current !== location.pathname
    )
      document.getElementById("main")?.focus();
    previousPath.current = location.pathname;
  }, [location.pathname]);
  async function logout() {
    if (intentionalLogout.current) return;
    intentionalLogout.current = true;
    setIsLoggingOut(true);
    try {
      await api.logout();
      await client.cancelQueries();
      await navigate({ to: "/" });
      client.clear();
      client.setQueryData(keys.session, { user: null, expiresAt: null });
      notify("Você saiu da sua conta.");
    } catch (error) {
      notify(errorMessage(error), "error");
    } finally {
      intentionalLogout.current = false;
      setIsLoggingOut(false);
    }
  }

  const count =
    cart.data?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const market = /^\/(nfts|cart|checkout|orders)/.test(location.pathname);
  const auth = /^\/(login|signup)/.test(location.pathname);
  const account = /^\/(profile|wallets)/.test(location.pathname);
  const home = location.pathname === "/";
  const receipt = location.pathname.startsWith("/orders/");
  const catalogSelected = market || (home && activeSection === "catalog");
  const learnSelected = home && activeSection === "learn";
  const creatorsSelected = home && activeSection === "creators";
  const links = (
    <>
      <Link
        to="/"
        className={
          home && !catalogSelected && !learnSelected && !creatorsSelected
            ? "selected"
            : ""
        }
      >
        Início
      </Link>
      <Link to="/" hash="catalog" className={catalogSelected ? "selected" : ""}>
        Mercado
      </Link>
      <Link
        to="/"
        hash="creators"
        className={creatorsSelected ? "selected" : ""}
      >
        Criadores
      </Link>
      <Link to="/" hash="learn" className={learnSelected ? "selected" : ""}>
        Aprenda
      </Link>
    </>
  );
  return (
    <>
      <a href="#main" className="skip-link">
        Pular para o conteúdo
      </a>
      {!receipt && (!mobile || account) && (
        <header
          className={`site-header ${market ? "market-header" : ""} ${auth ? "auth-header" : ""} ${account ? "account-header" : ""}`}
        >
          <div className="header-row">
            <Link to="/" aria-label="Jungle home" className="wordmark">
              <img
                src="/assets/kurio/wordmark.png"
                alt="KURIO"
                width="47"
                height="11"
              />
            </Link>
            <nav aria-label="Navegação principal" className="desktop-nav">
              {links}
            </nav>
            <div className="header-actions">
              <Link
                to="/"
                hash="catalog"
                aria-label="Buscar no mercado"
                className="header-search"
              >
                <FigmaIcon name="home/imgSearchIcon" />
              </Link>
              <Link
                to="/cart"
                aria-label={`Cart (${count})`}
                className="header-cart"
              >
                <FigmaIcon name="home/imgCartIcon" />
                <span>{count}</span>
              </Link>
              {user ? (
                <>
                  <Link
                    to="/profile"
                    aria-label="Perfil do colecionador"
                    className="account-link"
                  >
                    <FigmaIcon name="profile/imgUser" />
                  </Link>
                  <Link
                    to="/wallets"
                    aria-label="Minhas carteiras"
                    className="account-link"
                  >
                    <FigmaIcon name="mobile-checkout/imgWallet" />
                  </Link>
                  <Button
                    onClick={() => void logout()}
                    disabled={isLoggingOut}
                    aria-busy={isLoggingOut}
                    aria-label={isLoggingOut ? "Saindo…" : "Sign out"}
                    className="session-button"
                  >
                    <FigmaIcon name="home/imgLogout" />
                    {isLoggingOut ? "Saindo…" : "Sair"}
                  </Button>
                </>
              ) : (
                <Button
                  className="session-button"
                  data-login-trigger
                  onPointerEnter={() => void import("../features/Auth")}
                  onFocus={() => void import("../features/Auth")}
                  onClick={() => setAuthModal("login")}
                  aria-label="Entrar"
                >
                  <FigmaIcon name="home/imgLogout" />
                  Entrar
                </Button>
              )}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="mobile-menu"
                    aria-label="Open navigation"
                  >
                    <Menu size={20} />
                  </Button>
                </DialogTrigger>
                <DialogContent
                  title="Navigation"
                  description="Explore the marketplace and your collector account."
                >
                  <nav className="flex flex-col gap-5">
                    {["/", "/cart", "/profile", "/wallets", "/login"].map(
                      (path) => (
                        <DialogClose key={path} asChild>
                          <a href={path}>
                            {path === "/" ? "Explore" : path.slice(1)}
                          </a>
                        </DialogClose>
                      ),
                    )}
                  </nav>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>
      )}
      <main
        id="main"
        tabIndex={-1}
        className={`site-main ${auth ? "auth-main" : ""} ${account ? "account-main" : ""} ${market ? "market-main" : ""}`}
      >
        {account ? (
          <div className="account-layout">
            <nav className="account-sidebar" aria-label="Menu do colecionador">
              <h2>{mobile ? "Minha conta" : "Meu perfil"}</h2>
              <div className="account-primary-nav">
                <Link to="/profile" aria-label="Dados do perfil">
                  <AccountIcon name="user" />
                  {mobile ? "Perfil" : "Dados do perfil"}
                </Link>
                <Link to="/wallets">
                  <AccountIcon name="wallets" />
                  Carteiras
                </Link>
              </div>
              <details className="account-extra-nav" open={!mobile}>
                <summary>
                  Mais opções <ChevronDown aria-hidden="true" />
                </summary>
                <div className="account-extra-links">
                  {[
                    { label: "Atividade", icon: "activity" as const },
                    { label: "Lista de interesse", icon: "wishlist" as const },
                    { label: "Ofertas", icon: "offers" as const },
                    { label: "Arquivos baixados", icon: "downloads" as const },
                    { label: "Suporte", icon: "support" as const },
                  ].map(({ label, icon }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() =>
                        notify(
                          `${label}: esta seção ainda não está disponível.`,
                        )
                      }
                    >
                      <AccountIcon name={icon} />
                      {label}
                    </button>
                  ))}
                </div>
              </details>
              <button
                className="account-signout"
                onClick={() => void logout()}
                disabled={isLoggingOut}
                aria-busy={isLoggingOut}
              >
                <AccountIcon name="logout" />
                {isLoggingOut ? "Saindo…" : "Sair"}
              </button>
            </nav>
            <div className="account-content">
              <Outlet />
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
      {authModal && (
        <Suspense
          fallback={
            <p
              role="status"
              className="fixed bottom-5 left-1/2 z-50 text-foreground"
            >
              Abrindo login…
            </p>
          }
        >
          <AuthDialog
            signup={authModal === "signup"}
            destination={location.href}
            onClose={() => setAuthModal(null)}
            onModeChange={(signup) => setAuthModal(signup ? "signup" : "login")}
          />
        </Suspense>
      )}
      {!mobile && !account && !auth && !receipt && <MarketFooter />}
      {new URLSearchParams(location.searchStr).get("demo") === "1" && (
        <div className="compact-demo">
          <DemoControls notify={notify} />
        </div>
      )}
    </>
  );
}
function DemoControls({ notify }: { notify(message: string): void }) {
  const [open, setOpen] = useState(false);
  const [scenario, setScenario] = useState<Scenario>("standard");
  const client = useQueryClient();
  async function select(value: string) {
    try {
      const next = value as Scenario;
      await api.scenario(next);
      setScenario(next);
      notify(`Demo scenario: ${next}`);
      await client.invalidateQueries();
    } catch (error) {
      notify(errorMessage(error));
    }
  }
  async function event(kind: string) {
    if (kind === "expire") setOpen(false);
    await api.event(kind);
    if (kind === "expire")
      await client.invalidateQueries({ queryKey: keys.session });
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost">
          <FlaskConical size={16} /> Cenários de demonstração
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Cenários de demonstração"
        description="These controls call the mock API. Realtime updates travel through Socket.IO. No real purchases are made."
      >
        <div className="space-y-5">
          <Select
            label="Cenário de rede e negócio"
            value={scenario}
            onChange={(value) => void select(value)}
          >
            {SCENARIOS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <div className="flex flex-wrap gap-2">
            {[
              ["price", "Change NFT price"],
              ["stock", "Exhaust edition"],
              ["duplicate", "Duplicate event"],
              ["old", "Send older event"],
              ["disconnect", "Interrupt socket"],
              ["settle", "Resolve pending orders"],
              ["expire", "Expire session"],
            ].map(([kind, label]) => (
              <Button
                key={kind}
                variant="outline"
                onClick={() => void event(kind)}
              >
                {label}
              </Button>
            ))}
          </div>
          <Button
            variant="destructive"
            onClick={async () => {
              await api.reset();
              await client.cancelQueries();
              client.clear();
              window.location.assign("/");
            }}
          >
            Reset all demo data
          </Button>
          <p className="text-sm text-muted">
            Demo accounts: alex@example.test and maya@example.test. Password:
            Jungle123! Coupon: JUNGLE10. Reset also restores passwords, wallets
            and orders.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
