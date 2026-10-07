import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ChevronLeft, MoreVertical, Wallet } from "lucide-react";
import { useMobile } from "../lib/useMobile";
import type { CheckoutInput, Network, User } from "../api/contracts";
import { api, fieldErrors } from "../api/client";
import { keys } from "../app/query";
import { useNotify, useSession } from "../app/providers";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent } from "../components/ui/dialog";
import {
  ErrorState,
  Field,
  FormError,
  Loading,
  Select,
} from "../components/shared";
import { attemptKey } from "../lib/utils";
import { displayEth } from "../lib/money";
import { Summary } from "./Cart";
import { useQuote, useWallets } from "./hooks";
interface Attempt {
  key: string;
  payload: CheckoutInput;
}
export function Checkout() {
  const user = useSession().data?.user;
  return user ? (
    <CheckoutForm key={user.id} user={user} />
  ) : (
    <Loading kind="summary" />
  );
}
function CheckoutForm({ user }: { user: User }) {
  const mobile = useMobile();
  const [editingCollector, setEditingCollector] = useState(false);
  const navigate = useNavigate();
  const client = useQueryClient();
  const notify = useNotify();
  const quote = useQuote();
  const wallets = useWallets();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [username, setUsername] = useState(
    user.username ?? user.email.split("@")[0],
  );
  const [profileName, setProfileName] = useState(user.name);
  const [secondary, setSecondary] = useState("");
  const [provider, setProvider] =
    useState<CheckoutInput["collector"]["provider"]>("MetaMask");
  const [referral, setReferral] = useState("JUNGLE");
  const [note, setNote] = useState("");
  const [walletId, setWallet] = useState("");
  const [network, setNetwork] = useState<Network>("Ethereum");
  const [connected, setConnected] = useState(false);
  const [walletChoice, setWalletChoice] = useState<typeof provider | null>(
    null,
  );
  const collectorFormRef = useRef<HTMLFormElement>(null);
  const reviewButtonRef = useRef<HTMLButtonElement>(null);
  const [review, setReview] = useState(false);
  const [reviewedSignature, setReviewedSignature] = useState("");
  const [connectionChoice, setConnectionChoice] = useState("approve");
  const [attempt, setAttempt] = useState<Attempt | null>(() => {
    try {
      return JSON.parse(localStorage.getItem(attemptKey(user.id)) ?? "null");
    } catch {
      return null;
    }
  });
  const attemptRef = useRef(attempt);
  // Only restore an attempt loaded on mount. A newly submitted order is
  // already owned by the mutation; querying it here races its navigation.
  const restoringAttempt = useRef(!!attempt);
  const recovery = useQuery({
    queryKey: ["attempt", user.id, attempt?.key],
    queryFn: () => api.recoverOrder(attempt!.key),
    enabled: restoringAttempt.current && !!attempt,
    retry: false,
  });
  useEffect(() => {
    if (recovery.data)
      void navigate({
        to: "/orders/$orderId",
        params: { orderId: recovery.data.id },
      });
  }, [recovery.data, navigate]);
  const selected =
    wallets.data?.find((w) => w.id === walletId) ??
    wallets.data?.find((w) => w.primary) ??
    wallets.data?.[0];
  const connection = useMutation({
    mutationFn: (choice?: {
      walletId: string;
      network: Network;
      approve: boolean;
    }) =>
      api.connectWallet(
        choice?.walletId ?? selected!.id,
        choice?.network ?? network,
        choice?.approve ?? connectionChoice === "approve",
      ),
    onSuccess(data) {
      setConnected(data.connected);
      if (!data.connected) setWalletChoice(null);
      notify(
        data.connected
          ? "Carteira conectada na simulação."
          : "Conexão da carteira recusada. Você pode tentar novamente.",
      );
    },
    onError() {
      setWalletChoice(null);
      setConnected(false);
    },
  });
  const mutation = useMutation({
    mutationFn: async () => {
      // An uncertain attempt is recovered before any new operation is created.
      if (attempt) {
        try {
          return await api.recoverOrder(attempt.key);
        } catch (error) {
          if (!(axios.isAxiosError(error) && error.response?.status === 404))
            throw error;
        }
      }
      const latest = await api.quote();
      client.setQueryData(keys.quote(user.id), latest);
      if (latest.signature !== reviewedSignature || latest.issues.length) {
        setReview(false);
        throw new Error(
          "A cotação mudou. Revise o novo preço e confirme novamente.",
        );
      }
      const payload: CheckoutInput = {
        quoteId: latest.id,
        collector: {
          name,
          email,
          username,
          profileName,
          address: selected!.address,
          secondary,
          provider,
          referral,
          ensSuffix: ".eth",
          note,
        },
        walletId: selected!.id,
        network,
        connected,
      };
      const existing = attemptRef.current;
      const next =
        existing && JSON.stringify(existing.payload) === JSON.stringify(payload)
          ? existing
          : { key: crypto.randomUUID(), payload };
      attemptRef.current = next;
      setAttempt(next);
      localStorage.setItem(attemptKey(user.id), JSON.stringify(next));
      try {
        return await api.order(payload, next.key);
      } catch (error) {
        if (
          axios.isAxiosError(error) &&
          error.response &&
          error.response.status < 500
        ) {
          attemptRef.current = null;
          setAttempt(null);
          localStorage.removeItem(attemptKey(user.id));
          setReview(false);
          setEditingCollector(true);
          await client.invalidateQueries({ queryKey: keys.quote(user.id) });
          throw error;
        }
        // Timeout can occur after creation: recover the same order, never send a new key.
        try {
          return await api.recoverOrder(next.key);
        } catch {
          throw error;
        }
      }
    },
    async onSuccess(order) {
      client.setQueryData(keys.order(user.id, order.id), order);
      await navigate({ to: "/orders/$orderId", params: { orderId: order.id } });
    },
  });
  const errors = fieldErrors(mutation.error);
  if (quote.isPending || wallets.isPending) return <Loading kind="summary" />;
  if (quote.isError || wallets.isError)
    return (
      <ErrorState
        error={quote.error ?? wallets.error}
        retry={() => {
          void quote.refetch();
          void wallets.refetch();
        }}
      />
    );
  if (!quote.data.lines.length && !attempt)
    return (
      <div className="panel">
        <h1 className="text-3xl">Seu carrinho está vazio</h1>
        <Link to="/" className="mt-5 inline-block underline">
          Explorar NFTs
        </Link>
      </div>
    );
  return (
    <section className="checkout-page" aria-labelledby="checkout-title">
      {mobile && (
        <>
          <header className="mobile-payment-heading">
            <Link to="/cart" aria-label="Voltar ao carrinho">
              <ChevronLeft size={20} />
            </Link>
            <h1>Pagamento com carteira</h1>
          </header>
          <div className="mobile-payment-wallets">
            <div className="mobile-payment-wallets-heading">
              <h2>Carteira conectada</h2>
              <Link to="/wallets">Trocar carteira</Link>
            </div>
            <p role="status" className="sr-only">
              {connected
                ? "Conexão da carteira ativa."
                : "Conexão pendente. Escolha um provedor para conectar sua carteira."}
            </p>
            <fieldset>
              <legend className="sr-only">Carteiras salvas</legend>
              {wallets.data.map((wallet) => (
                <div className="mobile-payment-wallet" key={wallet.id}>
                  <label>
                    <input
                      type="radio"
                      name="saved-payment-wallet"
                      checked={selected?.id === wallet.id}
                      onChange={() => {
                        setWallet(wallet.id);
                        setNetwork(wallet.network);
                        setConnected(false);
                        setWalletChoice(null);
                      }}
                    />
                    <span>
                      <strong>
                        {wallet.primary ? "Principal" : wallet.label}
                      </strong>
                      <small>
                        {wallet.ens ||
                          `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`}
                      </small>
                      <small>Rede {wallet.network}</small>
                    </span>
                  </label>
                  <button
                    type="button"
                    aria-label="Editar dados do colecionador"
                    aria-expanded={editingCollector}
                    onClick={() => {
                      if (
                        editingCollector &&
                        !collectorFormRef.current?.reportValidity()
                      )
                        return;
                      setEditingCollector(!editingCollector);
                    }}
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>
              ))}
            </fieldset>
          </div>
        </>
      )}
      <header className="checkout-header">
        <nav aria-label="Breadcrumb" className="checkout-breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link to="/">Início</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link to="/" hash="catalog">
                Mercado
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Pagamento</li>
          </ol>
        </nav>
        <h1 id="checkout-title" className="sr-only">
          Pagamento
        </h1>
      </header>
      <div className="checkout-layout">
        <form
          ref={collectorFormRef}
          className="checkout-form"
          hidden={mobile && !editingCollector}
          id="collector-checkout"
          onSubmit={(e) => {
            e.preventDefault();
            setReviewedSignature(quote.data.signature);
            setReview(true);
          }}
        >
          <h2>Perfil do colecionador</h2>
          <div className="collector-fields">
            <Field
              label="Nome de exibição"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
              autoComplete="name"
              error={errors.name}
            />
            <Field
              label="Nome de usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={2}
              maxLength={32}
              pattern="[a-zA-Z0-9_.\-]+"
              autoComplete="username"
              error={errors.username}
            />
            <Select
              label="Rede"
              value={network}
              onChange={(value) => {
                setNetwork(value as Network);
                setConnected(false);
              }}
              error={errors.wallet}
            >
              <option>Ethereum</option>
              <option>Polygon</option>
            </Select>
            <Field
              label="Nome do perfil"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              required
              maxLength={80}
              error={errors.profileName}
            />
            <Field
              label="Endereço da carteira"
              value={selected?.address ?? ""}
              readOnly
              required
              placeholder="Endereço 0x da carteira"
              error={errors.address}
            />
            <Field
              label="Carteira secundária (opcional)"
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
              placeholder="ENS ou carteira secundária (opcional)"
              maxLength={120}
              error={errors.secondary}
            />
            <Select
              label="Tipo de carteira"
              value={provider}
              onChange={(value) => {
                setProvider(value as typeof provider);
                setConnected(false);
              }}
            >
              <option>MetaMask</option>
              <option>WalletConnect</option>
              <option>Coinbase Wallet</option>
            </Select>
            <Field
              label="Código de indicação"
              value={referral}
              onChange={(e) => setReferral(e.target.value)}
              required
              maxLength={32}
              pattern="[a-zA-Z0-9_\-]+"
              error={errors.referral}
            />
            <Field
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              error={errors.email}
            />
            <div className="checkout-ens">
              <Select label="Nome ENS" value=".eth" onChange={() => {}}>
                <option>.eth</option>
              </Select>
            </div>
          </div>
          <Link to="/wallets" className="another-wallet">
            Usar outra carteira?
          </Link>
          <label className="collector-note">
            Observação do colecionador (opcional)
            <textarea
              className="input"
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              aria-invalid={!!errors.note}
              aria-describedby={
                errors.note ? "collector-note-error" : undefined
              }
            />
          </label>
          {errors.note && (
            <p id="collector-note-error" className="text-red-300">
              {errors.note}
            </p>
          )}
        </form>
        <Summary
          quote={quote.data}
          title="Seus NFTs"
          className="checkout-summary"
          showDemoNote={false}
          discountLabel="Desconto do lançamento"
          feeLabel="Taxa de rede"
          feeHint
          beforeTotals={
            <p className="checkout-coupon">
              Tem um código promocional? <Link to="/cart">Aplique aqui</Link>
            </p>
          }
          items={
            <div className="checkout-items">
              <div className="checkout-items-heading">
                <span>NFTs</span>
                <span>Subtotal</span>
              </div>
              {quote.data.lines.map((line) => (
                <div
                  className="checkout-item"
                  key={`${line.nftId}-${line.editionId}`}
                >
                  <img
                    src={line.image}
                    alt={line.name}
                    width="70"
                    height="70"
                  />
                  <div>
                    <strong>{line.name}</strong>
                    <p>
                      ID do token: #
                      {(
                        line.name.match(/#(\d+)/)?.[1] ??
                        line.nftId.replace("nft-", "")
                      ).padStart(4, "0")}
                    </p>
                  </div>
                  <span className="checkout-item-quantity">
                    (× {line.quantity})
                  </span>
                  <b>{displayEth(line.total)}</b>
                </div>
              ))}
            </div>
          }
        >
          <div className="checkout-connection">
            <h2 className="text-xl font-semibold">Carteira e rede</h2>
            {!wallets.data?.length ? (
              <p className="text-muted">
                Adicione uma carteira para continuar.{" "}
                <Link to="/wallets" className="text-primary underline">
                  Gerenciar carteiras
                </Link>
              </p>
            ) : (
              <div className="checkout-wallet-selection">
                <details className="checkout-wallet-manual">
                  <summary aria-label="Configurar carteira manualmente">
                    <span aria-hidden="true">○</span>
                    <span className="wallet-chip">
                      METAMASK · WALLETCONNECT · COINBASE
                    </span>
                  </summary>
                  <div className="checkout-wallet-settings">
                    <Select
                      label="Carteira selecionada"
                      value={selected?.id ?? ""}
                      onChange={(value) => {
                        setWallet(value);
                        setConnected(false);
                      }}
                    >
                      {wallets.data.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.label} ({w.network})
                        </option>
                      ))}
                    </Select>
                    <p className="break-all text-xs text-muted">
                      {selected?.address}
                    </p>
                    <Select
                      label="Resposta da conexão simulada"
                      value={connectionChoice}
                      onChange={setConnectionChoice}
                    >
                      <option value="approve">Aprovar conexão</option>
                      <option value="decline">Recusar conexão</option>
                    </Select>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={
                          connection.isPending || selected?.network !== network
                        }
                        onClick={() => {
                          if (connected) {
                            setWalletChoice(null);
                            setConnected(false);
                          } else connection.mutate();
                        }}
                      >
                        {connected
                          ? "Desconectar carteira"
                          : "Conectar carteira"}
                      </Button>
                      <span role="status" className="text-sm">
                        {connected ? "Conectada (simulação)" : "Não conectada"}
                      </span>
                    </div>
                    <FormError error={connection.error} />
                    {selected?.network !== network && (
                      <p className="text-sm text-red-300">
                        Selecione a rede cadastrada para esta carteira.
                      </p>
                    )}
                  </div>
                </details>
                <fieldset className="checkout-wallet-providers">
                  <legend className="sr-only">Conectar carteira</legend>
                  {(mobile
                    ? ([
                        "WalletConnect",
                        "MetaMask",
                        "Coinbase Wallet",
                      ] as const)
                    : (["MetaMask", "Coinbase Wallet"] as const)
                  ).map((walletProvider) => (
                    <label
                      key={walletProvider}
                      className={
                        walletChoice === walletProvider ? "selected" : ""
                      }
                    >
                      <input
                        type="radio"
                        name="checkout-provider"
                        value={walletProvider}
                        checked={walletChoice === walletProvider}
                        disabled={connection.isPending}
                        onChange={() => {
                          const wallet =
                            wallets.data?.find(
                              (w) =>
                                w.provider === walletProvider &&
                                w.network === network,
                            ) ?? selected;
                          if (!wallet) return;
                          setWalletChoice(walletProvider);
                          setProvider(walletProvider);
                          setWallet(wallet.id);
                          setNetwork(wallet.network);
                          setConnected(false);
                          connection.mutate({
                            walletId: wallet.id,
                            network: wallet.network,
                            approve: true,
                          });
                        }}
                      />
                      {mobile && (
                        <span
                          className="payment-provider-icon"
                          aria-hidden="true"
                        >
                          {walletProvider === "Coinbase Wallet" ? (
                            <Wallet size={18} />
                          ) : (
                            walletProvider[0]
                          )}
                        </span>
                      )}
                      <span>{walletProvider}</span>
                    </label>
                  ))}
                </fieldset>
              </div>
            )}
            <FormError error={mutation.error} />
            <Button
              ref={reviewButtonRef}
              type="submit"
              form="collector-checkout"
              className="w-full"
              disabled={
                !selected ||
                !connected ||
                quote.data.issues.length > 0 ||
                mutation.isPending
              }
            >
              Confirmar compra
            </Button>
            {attempt && recovery.isError && (
              <div className="space-y-3">
                <p className="text-sm text-amber-200">
                  A previous attempt needs recovery before a new payment can be
                  submitted.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void recovery.refetch()}
                >
                  Recover previous attempt
                </Button>
              </div>
            )}
          </div>
        </Summary>
      </div>
      <Dialog open={review} onOpenChange={setReview}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            reviewButtonRef.current?.focus();
          }}
          title="Revise seu pedido"
          description="Confira os dados, a carteira e a cotação atual. Esta compra é simulada, sem uso de dinheiro real."
        >
          <div className="space-y-5">
            <p>
              {name} · @{username} · {email}
            </p>
            {note && <p>{note}</p>}
            <p>
              {selected?.label} · {network}
            </p>
            <p className="break-all text-xs text-muted">{selected?.address}</p>
            <p className="text-2xl font-semibold">
              {displayEth(quote.data.total)}
            </p>
            {reviewedSignature !== quote.data.signature && (
              <p role="alert" className="text-red-300">
                Price or availability changed. Close this dialog and review the
                updated order.
              </p>
            )}
            <FormError error={mutation.error} />
            <Button
              className="w-full"
              disabled={
                mutation.isPending ||
                reviewedSignature !== quote.data.signature ||
                !!quote.data.issues.length
              }
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending
                ? "Enviando pedido…"
                : "Confirmar compra simulada"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
