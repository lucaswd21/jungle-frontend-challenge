import { useMobile } from "../lib/useMobile";
import { useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Heart,
  ChevronLeft,
  ShoppingBag,
  ShoppingCart,
  Minus,
  Plus,
  Mail,
  Link as LinkIcon,
} from "lucide-react";
import { useNotify } from "../app/providers";
import { api } from "../api/client";
import { RelatedCollection } from "./Catalog";
import { Gallery } from "../components/Gallery";
import { Button } from "../components/ui/button";
import { ErrorState, Field, FormError, Loading } from "../components/shared";
import { displayEth } from "../lib/money";
import { useCartAction, useFavorite } from "./hooks";
export function Detail() {
  const mobile = useMobile();
  const notify = useNotify();
  const [showReviews, setShowReviews] = useState(false);
  const { nftId } = useParams({ from: "/nfts/$nftId" });
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ["nft", nftId],
    queryFn: ({ signal }) => api.nft(nftId, signal),
  });
  const [editionId, setEdition] = useState("standard");
  const [quantity, setQuantity] = useState(1);
  const add = useCartAction("add");
  const favorite = useFavorite();
  if (query.isPending) return <Loading kind="detail" />;
  if (query.isError)
    return (
      <ErrorState error={query.error} retry={() => void query.refetch()} />
    );
  const nft = query.data;
  const edition =
    nft.editions.find((e) => e.id === editionId) ?? nft.editions[0];
  const liked = favorite.query.data?.includes(nftId) ?? false;
  const favoriteButton = (
    <Button
      variant="outline"
      className="detail-favorite"
      aria-label={
        mobile
          ? liked
            ? "Remover dos favoritos"
            : "Adicionar aos favoritos"
          : liked
            ? "Favoritar: Remover dos favoritos"
            : "Favoritar: Adicionar aos favoritos"
      }
      aria-pressed={liked}
      disabled={favorite.mutation.isPending}
      onClick={() => {
        if (!favorite.user)
          void navigate({
            to: "/login",
            search: { returnTo: `/nfts/${nftId}` },
          });
        else favorite.mutation.mutate({ id: nftId, active: !liked });
      }}
    >
      <Heart size={18} fill={liked ? "currentColor" : "none"} />
      {!mobile && <span>Favoritar</span>}
    </Button>
  );
  const editions = ["unique", "rare", "standard", "open"].flatMap((id) =>
    nft.editions.filter((e) => e.id === id),
  );
  function openReviews() {
    setShowReviews(true);
    document.getElementById("nft-information")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }
  return (
    <>
      <Link
        to="/"
        className="detail-back mb-7 inline-block text-sm text-muted hover:text-foreground"
      >
        {mobile ? (
          <>
            <ChevronLeft size={28} aria-hidden="true" />
            <span className="sr-only">Voltar ao mercado</span>
          </>
        ) : (
          "Início / Mercado"
        )}
      </Link>
      <div className="detail-layout">
        <Gallery key={nft.id} nft={nft} />
        <div className="detail-copy">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm font-semibold text-primary">Kurio Editions</p>
            {mobile && favoriteButton}
          </div>
          <div className="detail-heading">
            <h1 className="detail-title">{nft.name}</h1>
            {mobile && (
              <button
                className="detail-rating"
                type="button"
                onClick={openReviews}
                aria-label="4.8 (19). Ver avaliações ilustrativas"
              >
                <span aria-hidden="true">★</span> 4.8 <span>(19)</span>
              </button>
            )}
          </div>
          {!mobile && (
            <div className="detail-price-rating">
              <p>{displayEth(edition.price)}</p>
              <button
                type="button"
                onClick={openReviews}
                aria-label="19 avaliações de colecionadores. Ver avaliações ilustrativas"
              >
                <span aria-hidden="true">★★★★★</span> 19 avaliações de
                colecionadores
              </button>
            </div>
          )}
          <p className="mt-4 text-muted">
            Criado por <span className="text-foreground">{nft.creator}</span>
          </p>
          {!mobile && <h2 className="detail-about">Sobre este NFT:</h2>}
          <p className="my-7 leading-relaxed text-muted">
            {mobile ? (nft.summary ?? nft.description) : nft.description}
          </p>
          <div className="detail-purchase space-y-5">
            <div>
              <p className="text-sm text-muted">Preço da edição</p>
              <p className="mt-1 text-3xl font-semibold">
                {displayEth(edition.price)}
              </p>
            </div>
            <fieldset className="edition-options">
              <legend>Edição</legend>
              <div>
                {editions.map((e) => (
                  <button
                    type="button"
                    key={e.id}
                    disabled={!e.available}
                    aria-pressed={edition.id === e.id}
                    onClick={() => {
                      setEdition(e.id);
                      setQuantity(1);
                    }}
                  >
                    {e.name}
                    {!e.available ? " — esgotada" : ""}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="edition-metadata">
              <p>
                ID do token: #
                {(
                  nft.name.split("#")[1] ?? nft.id.replace("nft-", "")
                ).padStart(4, "0")}
              </p>
              <p>Coleção: Kurio Apes</p>
              <p>
                Atributos:{" "}
                {nft.id === "nft-1"
                  ? "Óculos, Esmeralda, Raro"
                  : "Arte digital, Edição limitada"}
              </p>
            </div>
            <div className="detail-transaction">
              <div className="quantity-row">
                <span aria-hidden="true">Qtd.</span>
                <button
                  type="button"
                  aria-label="Diminuir quantidade"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                >
                  <Minus size={14} />
                </button>
                <Field
                  label="Quantidade"
                  type="number"
                  min={1}
                  max={edition.available}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
                <button
                  type="button"
                  aria-label="Aumentar quantidade"
                  disabled={quantity >= edition.available}
                  onClick={() =>
                    setQuantity((value) =>
                      Math.min(edition.available, value + 1),
                    )
                  }
                >
                  <Plus size={14} />
                </button>
              </div>
              <p className="mobile-edition-price">
                {displayEth(edition.price)}
              </p>
              <FormError error={add.error} />
              <div className="detail-actions">
                <Button
                  aria-label="Comprar NFT"
                  className="w-full"
                  disabled={
                    add.isPending ||
                    !edition.available ||
                    quantity < 1 ||
                    !Number.isInteger(quantity) ||
                    quantity > edition.available
                  }
                  onClick={() =>
                    add.mutate({ nftId, editionId: edition.id, quantity })
                  }
                >
                  <ShoppingBag size={18} />
                  {add.isPending
                    ? "Adicionando…"
                    : mobile
                      ? "Comprar NFT"
                      : "COMPRAR"}
                </Button>
                {!mobile && favoriteButton}
                <Button
                  variant="outline"
                  asChild
                  className="detail-cart-link w-full"
                >
                  <Link to="/cart" aria-label="Ver carrinho">
                    {mobile ? (
                      <img
                        src="/assets/kurio/mobile/cart.png"
                        width="18"
                        height="17"
                        alt=""
                      />
                    ) : (
                      <ShoppingCart size={20} />
                    )}
                    <span>Ver carrinho</span>
                  </Link>
                </Button>
              </div>
            </div>
            <p className="edition-availability text-sm text-muted">
              {edition.available} disponíveis nesta edição
            </p>
            {!mobile && (
              <div className="detail-share">
                <span>Compartilhar este NFT:</span>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Compartilhar no LinkedIn (nova aba)"
                >
                  in
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent(nft.name)}&body=${encodeURIComponent(window.location.href)}`}
                  aria-label="Compartilhar por e-mail"
                >
                  <Mail size={16} />
                </a>
                <button
                  type="button"
                  aria-label="Copiar link do NFT"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(window.location.href)
                      .then(
                        () => notify("Link do NFT copiado."),
                        () =>
                          notify("Não foi possível copiar o link.", "error"),
                      );
                  }}
                >
                  <LinkIcon size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <section className="nft-description" id="nft-information">
        <h2 className="sr-only">Informações do NFT</h2>
        <div
          className="nft-information-tabs"
          role="group"
          aria-label="Informações do NFT"
        >
          <button
            type="button"
            aria-pressed={!showReviews}
            onClick={() => setShowReviews(false)}
          >
            Detalhes do NFT
          </button>
          <button
            type="button"
            aria-pressed={showReviews}
            onClick={() => setShowReviews(true)}
          >
            Avaliações de colecionadores (19)
          </button>
        </div>
        {showReviews ? (
          <p role="status">
            Avaliações ilustrativas do layout de referência. Esta demonstração
            não possui avaliações reais ou envio de comentários.
          </p>
        ) : (
          <>
            <p>
              {nft.name} é uma obra digital finalizada à mão da coleção Kurio
              Editions. Cada atributo fica armazenado nos metadados do token e
              verificado na {nft.network}. A obra explora identidade, movimento
              e luz em um mundo digital sem fronteiras.
            </p>
            <p>
              A propriedade inclui a arte em alta resolução, acesso exclusivo
              para colecionadores e um registro permanente de procedência na
              rede. Os dados de propriedade e pagamento desta demonstração são
              simulados.
            </p>
            <h3>Rede</h3>
            <p>
              {nft.network ?? "Ethereum"} · Metadados e transações simulados.
            </p>
            <h3>Contrato</h3>
            <p>
              Direitos autorais do criador: 5% nas vendas secundárias, pagos
              pelos mercados compatíveis. Conteúdo de referência do design;
              nenhuma transação real é executada.
            </p>
            <h3>Direitos autorais:</h3>
            <p>
              Metadados e identificação de contrato ilustrativos; nenhuma
              transação real é executada.
            </p>
          </>
        )}
      </section>
      {!mobile && <RelatedCollection />}
    </>
  );
}
