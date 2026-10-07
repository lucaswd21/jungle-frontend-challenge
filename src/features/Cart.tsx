import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Quote } from "../api/contracts";
import { api } from "../api/client";
import { keys } from "../app/query";
import { useNotify, useSession } from "../app/providers";
import { Button } from "../components/ui/button";
import {
  ErrorState,
  Field,
  FormError,
  Loading,
  PageTitle,
} from "../components/shared";
import { displayEth } from "../lib/money";
import { useCart, useCartAction, useQuote } from "./hooks";
import { RelatedCollection } from "./Catalog";
import { useMobile } from "../lib/useMobile";
export function Summary({
  quote,
  children,
  items,
  title = "Resumo do carrinho",
  className = "",
  beforeTotals,
  showDemoNote = true,
  discountLabel = "Desconto",
  feeLabel = "Taxa de rede (estimada)",
  feeHint = false,
}: {
  quote: Quote;
  items?: React.ReactNode;
  title?: string;
  className?: string;
  children?: React.ReactNode;
  beforeTotals?: React.ReactNode;
  showDemoNote?: boolean;
  discountLabel?: string;
  feeLabel?: string;
  feeHint?: boolean;
}) {
  return (
    <aside
      className={`order-summary panel space-y-5 ${className}`}
      aria-label="Order summary"
    >
      <h2 className="text-xl font-semibold">{title}</h2>
      {items}
      {beforeTotals}
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt>Subtotal</dt>
          <dd>{displayEth(quote.subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>
            {discountLabel} {quote.coupon && `(${quote.coupon})`}
          </dt>
          <dd>−{displayEth(quote.discount)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>
            {feeLabel}
            {feeHint && (
              <small className="checkout-fee-hint">Taxa estimada</small>
            )}
          </dt>
          <dd>{displayEth(quote.fee)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-border pt-4 text-lg font-semibold">
          <dt>Total</dt>
          <dd data-testid="total">{displayEth(quote.total)}</dd>
        </div>
      </dl>
      {quote.issues.length > 0 && (
        <div role="alert" className="text-sm text-red-300">
          {quote.issues.map((issue) => (
            <p key={issue}>{issue}</p>
          ))}
        </div>
      )}
      {children}
      {showDemoNote && (
        <p className="text-xs text-muted">
          Demonstração: sem pagamento real ou extensão de carteira.
        </p>
      )}
    </aside>
  );
}
export function CartPage() {
  const mobile = useMobile();
  const notify = useNotify();
  const cart = useCart();
  const quote = useQuote();
  const quantity = useCartAction("quantity");
  const remove = useCartAction("remove");
  const [code, setCode] = useState("");
  const client = useQueryClient();
  const user = useSession().data?.user;
  const coupon = useMutation({
    mutationFn: api.coupon,
    onSuccess(data) {
      client.setQueryData(keys.quote(user?.id), data);
      void client.invalidateQueries({ queryKey: keys.cart(user?.id) });
      notify(data.coupon ? "Cupom aplicado." : "Cupom removido.");
    },
  });
  return (
    <div className="cart-page">
      {mobile ? (
        <div className="cart-mobile-heading">
          <Link to="/" aria-label="Voltar ao mercado">
            <ChevronLeft size={20} aria-hidden="true" />
          </Link>
          <h1>Carrinho de NFTs</h1>
        </div>
      ) : (
        <PageTitle
          eyebrow="Início / Mercado / Carrinho"
          title="Carrinho de NFTs"
        />
      )}
      {quote.isPending || cart.isPending ? (
        <Loading kind="summary" />
      ) : quote.isError || cart.isError ? (
        <ErrorState
          error={quote.error ?? cart.error}
          retry={() => {
            void quote.refetch();
            void cart.refetch();
          }}
        />
      ) : !quote.data.lines.length ? (
        <div className="panel space-y-5">
          <h2 className="text-xl font-semibold">Seu carrinho está vazio</h2>
          <p className="text-muted">
            Discover an artwork to begin your collection.
          </p>
          <Button asChild>
            <Link to="/">Explorar NFTs</Link>
          </Button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items space-y-5">
            <div className="cart-table-header" aria-hidden="true">
              <span>NFTs</span>
              <span>Preço</span>
              <span>Edições</span>
              <span>Total</span>
            </div>
            {quote.data.lines.map((line) => (
              <article
                key={`${line.nftId}-${line.editionId}`}
                className="cart-line"
              >
                <Link to="/nfts/$nftId" params={{ nftId: line.nftId }}>
                  <img
                    src={line.image}
                    alt={line.name}
                    width="100"
                    height="100"
                    className="aspect-square rounded-xl object-cover"
                  />
                </Link>
                <div>
                  <h2 className="font-semibold">
                    <Link to="/nfts/$nftId" params={{ nftId: line.nftId }}>
                      {line.name}
                    </Link>
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {mobile && (
                      <span className="cart-edition">
                        Edição: {line.edition}
                      </span>
                    )}
                    <span className="cart-token">
                      ID do token: #
                      {line.name.match(/#(\d+)/)?.[1].padStart(4, "0") ??
                        line.nftId}
                    </span>
                    <span className="cart-unit-price">
                      {displayEth(line.unitPrice)}
                    </span>
                  </p>
                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <div className="w-24 cart-quantity">
                      <Button
                        type="button"
                        variant="ghost"
                        aria-label={`Diminuir quantidade de ${line.name}`}
                        disabled={quantity.isPending || line.quantity <= 1}
                        onClick={() =>
                          quantity.mutate({
                            nftId: line.nftId,
                            editionId: line.editionId,
                            quantity: line.quantity - 1,
                          })
                        }
                      >
                        −
                      </Button>
                      <Field
                        label={`Quantity for ${line.name}`}
                        type="number"
                        min={1}
                        max={line.available}
                        value={line.quantity}
                        disabled={quantity.isPending}
                        onChange={(e) =>
                          quantity.mutate({
                            nftId: line.nftId,
                            editionId: line.editionId,
                            quantity: Number(e.target.value),
                          })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        aria-label={`Aumentar quantidade de ${line.name}`}
                        disabled={
                          quantity.isPending || line.quantity >= line.available
                        }
                        onClick={() =>
                          quantity.mutate({
                            nftId: line.nftId,
                            editionId: line.editionId,
                            quantity: line.quantity + 1,
                          })
                        }
                      >
                        +
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      className="cart-remove"
                      aria-label={`Remove ${line.name}`}
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(line)}
                    >
                      <img
                        src="/assets/kurio/delete.png"
                        alt=""
                        width="18"
                        height="20"
                        aria-hidden="true"
                      />
                    </Button>
                    <p className="ml-auto pb-3 text-sm font-semibold">
                      {displayEth(line.total)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
            <FormError error={quantity.error || remove.error} />
          </div>
          <Summary
            quote={quote.data}
            title="Resumo da carteira"
            className="cart-summary"
            showDemoNote={!mobile}
            discountLabel={mobile ? "Desconto do lançamento" : "Desconto"}
            feeLabel={mobile ? "Taxa de rede" : "Taxa de rede (estimada)"}
            feeHint={mobile}
            beforeTotals={
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  coupon.mutate(code);
                }}
                className="coupon-form space-y-4"
              >
                <label htmlFor="cart-coupon" className="block font-medium">
                  Código promocional
                </label>
                <div className="coupon-entry">
                  <input
                    id="cart-coupon"
                    className="input"
                    placeholder="Digite o código promocional..."
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                  <Button disabled={coupon.isPending}>Aplicar</Button>
                </div>
                {quote.data.coupon && (
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => coupon.mutate("")}
                  >
                    Remover cupom
                  </Button>
                )}
                <FormError error={coupon.error} />
              </form>
            }
          >
            <Button asChild className="w-full">
              <Link to="/checkout">Conectar e finalizar</Link>
            </Button>
            <Link to="/" className="cart-continue">
              Continuar explorando
            </Link>
          </Summary>
        </div>
      )}
      {!mobile && quote.data?.lines.length ? (
        <RelatedCollection title="Colecionadores também viram" />
      ) : null}
    </div>
  );
}
