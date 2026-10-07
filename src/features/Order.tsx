import { useEffect } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, XCircle } from "lucide-react";
import { api } from "../api/client";
import { keys } from "../app/query";
import { useNotify, useSession } from "../app/providers";
import { Button } from "../components/ui/button";
import { ErrorState, Loading, PageTitle } from "../components/shared";
import { attemptKey } from "../lib/utils";
import { Summary } from "./Cart";
import { displayEth, wei } from "../lib/money";
import type { Order } from "../api/contracts";
export function OrderPage() {
  const { orderId } = useParams({ from: "/orders/$orderId" });
  const user = useSession().data?.user;
  const client = useQueryClient();
  const query = useQuery({
    queryKey: keys.order(user?.id, orderId),
    queryFn: ({ signal }) => api.getOrder(orderId, signal),
    enabled: !!user,
    refetchInterval: (q) => (q.state.data?.status === "pending" ? 1000 : false),
    refetchOnReconnect: true,
  });
  useEffect(() => {
    if (query.data && query.data.status !== "pending" && user) {
      localStorage.removeItem(attemptKey(user.id));
      void client.invalidateQueries({ queryKey: keys.cart(user.id) });
      void client.invalidateQueries({ queryKey: keys.quote(user.id) });
    }
  }, [query.data?.status, query.data, user, client]);
  if (query.isPending) return <Loading kind="summary" />;
  if (query.isError)
    return (
      <ErrorState error={query.error} retry={() => void query.refetch()} />
    );
  const order = query.data;
  if (order.status === "confirmed") return <ConfirmedReceipt order={order} />;
  return (
    <section className="receipt-page">
      <div className="mb-6 text-primary">
        {order.status === "declined" ? (
          <XCircle size={48} className="text-red-300" />
        ) : (
          <Clock3 size={48} />
        )}
      </div>
      <PageTitle
        eyebrow={`Order ${order.id}`}
        title={
          order.status === "declined" ? "Pagamento recusado" : "Pedido pendente"
        }
      >
        <p role="status">
          {order.status === "declined"
            ? order.reason
            : "Aguardando o resultado do pagamento simulado. Ao recarregar, você recupera o mesmo pedido."}
        </p>
      </PageTitle>
      <div className="receipt-layout">
        <div className="panel space-y-5">
          <h2 className="text-xl font-semibold">Detalhes do pedido</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted">Colecionador</dt>
              <dd>
                {order.collector.name} · {order.collector.email}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Rede / carteira</dt>
              <dd>
                {order.wallet.network} / {order.wallet.label}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Identificador do pedido</dt>
              <dd data-testid="order-id">{order.id}</dd>
            </div>
            {order.collector.username && (
              <div>
                <dt className="text-muted">Perfil</dt>
                <dd>
                  @{order.collector.username} · {order.collector.provider}
                </dd>
              </div>
            )}
            {order.collector.note && (
              <div>
                <dt className="text-muted">Observação do colecionador</dt>
                <dd>{order.collector.note}</dd>
              </div>
            )}
            {order.transaction && (
              <div>
                <dt className="text-muted">Transação simulada</dt>
                <dd className="break-all">{order.transaction}</dd>
              </div>
            )}
          </dl>
          <ul className="space-y-4">
            {order.quote.lines.map((line) => (
              <li
                key={`${line.nftId}-${line.editionId}`}
                className="flex items-center gap-4 border-t border-border pt-4"
              >
                <img
                  src={line.image}
                  alt={line.name}
                  width="64"
                  height="64"
                  className="rounded-xl"
                />
                <div>
                  <p className="font-semibold">{line.name}</p>
                  <p className="text-sm text-muted">
                    {line.quantity} × {line.edition}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <Button asChild>
            <Link to={order.status === "declined" ? "/cart" : "/"}>
              {order.status === "declined"
                ? "Voltar ao carrinho"
                : "Continuar explorando"}
            </Link>
          </Button>
        </div>
        <Summary quote={order.quote} />
      </div>
    </section>
  );
}

function ConfirmedReceipt({ order }: { order: Order }) {
  const notify = useNotify();
  return (
    <section className="thank-you-card" aria-labelledby="receipt-title">
      <Link to="/" className="receipt-close" aria-label="Fechar recibo">
        ×
      </Link>
      <header className="thank-you-header">
        <img src="/assets/thank-you.png" width="80" height="80" alt="" />
        <h1 id="receipt-title" aria-label="Pedido confirmado">
          Seus NFTs agora estão na sua carteira
        </h1>
      </header>
      <dl className="receipt-facts">
        <div>
          <dt>ID da transação</dt>
          <dd data-testid="order-id" title={order.transaction ?? order.id}>
            {order.id}
          </dd>
        </div>
        <div>
          <dt>Data</dt>
          <dd>
            {new Intl.DateTimeFormat("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }).format(order.createdAt)}
          </dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{displayEth(order.quote.total)}</dd>
        </div>
        <div>
          <dt>Carteira</dt>
          <dd>{order.collector.provider}</dd>
        </div>
      </dl>
      <div className="receipt-content">
        <h2>Detalhes da transação</h2>
        <div className="receipt-table-heading" aria-hidden="true">
          <span>NFTs</span>
          <span>Edições</span>
          <span>Subtotal</span>
        </div>
        <ul className="receipt-nfts">
          {order.quote.lines.map((line) => (
            <li key={`${line.nftId}-${line.editionId}`}>
              <img src={line.image} alt={line.name} width="64" height="64" />
              <div>
                <strong>{line.name}</strong>
                <p>
                  ID do token: #
                  {(line.name.match(/#(\d+)/)?.[1] ?? line.nftId).padStart(
                    4,
                    "0",
                  )}
                </p>
              </div>
              <span>(× {line.quantity})</span>
              <b>{displayEth(line.total)}</b>
            </li>
          ))}
        </ul>
        <dl className="receipt-totals">
          {wei(order.quote.discount) > 0n && (
            <div>
              <dt>Desconto</dt>
              <dd>−{displayEth(order.quote.discount)}</dd>
            </div>
          )}
          <div>
            <dt>Taxa de rede</dt>
            <dd>{displayEth(order.quote.fee)}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd data-testid="total">{displayEth(order.quote.total)}</dd>
          </div>
        </dl>
        <p className="receipt-confirmation" role="status">
          Transação confirmada na {order.wallet.network}. A propriedade foi
          transferida para sua carteira conectada e registrada na rede.
        </p>
        <div className="receipt-action">
          <Button
            type="button"
            onClick={() =>
              notify(
                "Esta compra é simulada: não há transação real para consultar no Etherscan.",
              )
            }
          >
            Ver no Etherscan
          </Button>
        </div>
        <div className="sr-only" aria-label="Dados do colecionador">
          <p>
            {order.collector.name} · {order.collector.email}
          </p>
          <p>
            {order.wallet.label} · {order.wallet.network}
          </p>
          {order.collector.note && <p>{order.collector.note}</p>}
          <p className="break-all">{order.transaction}</p>
        </div>
      </div>
    </section>
  );
}
