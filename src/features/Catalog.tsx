import { useState } from "react";
import { ArrowRight, Heart } from "lucide-react";
import { useFavorite } from "./hooks";
import { useMobile } from "../lib/useMobile";
import { MobileNavigation } from "../components/MobileNavigation";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { CatalogSearch, Nft } from "../api/contracts";
import { Button } from "../components/ui/button";
import { ErrorState, Field, Loading, Select } from "../components/shared";
import { FigmaIcon } from "../components/FigmaIcon";
import { displayEth } from "../lib/money";
import assets from "../lib/figma-assets.json";

export function Hero() {
  const mobile = useMobile();
  return (
    <section className="market-hero">
      <div className="hero-copy">
        <p>Bem-vindo à Kurio</p>
        <h1>
          {mobile ? (
            <>
              SEJA DONO DA
              <br />
              CULTURA DIGITAL
            </>
          ) : (
            <>
              SEJA DONO DO FUTURO
              <br />
              DA ARTE DIGITAL
            </>
          )}
        </h1>
        <p className="hero-description">
          {mobile ? (
            <>
              Descubra NFTs selecionados
              <br />
              de criadores do mundo
              <br />
              todo.
            </>
          ) : (
            "Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e torne uma parte da internet sua."
          )}
        </p>
        <Button asChild>
          <a href="#catalog">
            EXPLORAR
            {mobile && (
              <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
            )}
          </a>
        </Button>
      </div>
      <Link
        to="/nfts/$nftId"
        params={{ nftId: "nft-1" }}
        aria-label="Discover Emerald Ape #042"
        className="hero-art"
      >
        <img
          src={assets["home/imgFrame136"]}
          alt="Emerald Ape #042, macaco com óculos e jaqueta verde"
          width="450"
          height="450"
          fetchPriority="high"
          srcSet="/assets/kurio/emerald.webp 250w, /assets/kurio/hero.webp 450w"
          sizes="(max-width:767px) 138px, 450px"
        />
        {mobile && (
          <img
            className="hero-mini"
            src="/assets/kurio/sage.webp"
            alt=""
            width="60"
            height="60"
          />
        )}
      </Link>
      <div className="hero-dots" aria-hidden="true">
        {mobile ? (
          <>
            <span />
            <span />
            <span />
          </>
        ) : (
          "● ● ●"
        )}
      </div>
    </section>
  );
}
export function Catalog({ backdrop = false }: { backdrop?: boolean }) {
  const mobile = useMobile();
  const rawSearch = useSearch({ strict: false });
  const search: CatalogSearch = backdrop
    ? { q: "", category: "", sort: "featured", page: 1 }
    : (rawSearch as CatalogSearch);
  const navigate = useNavigate({ from: "/" });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(String(search.min ?? 0.02));
  const [maxPrice, setMaxPrice] = useState(String(search.max ?? 12.3));
  const query = useQuery({
    queryKey: ["catalog", search],
    queryFn: ({ signal }) => api.catalog(search, signal),
  });
  function update(value: Partial<CatalogSearch>) {
    void navigate({
      search: { ...search, ...value, page: value.page ?? 1 },
      viewTransition: false,
      resetScroll: false,
    }).then(() => {
      if (value.page !== undefined) {
        document.getElementById("catalog")?.scrollIntoView({
          block: "start",
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
        });
      }
    });
  }
  return (
    <>
      {mobile && (
        <div className="mobile-catalog-search">
          <img
            className="mobile-search-icon"
            src="/assets/kurio/search.svg"
            alt=""
            width="20"
            height="20"
          />
          <Field
            label="Buscar NFTs"
            placeholder="Explorar coleções"
            value={search.q}
            onChange={(e) => update({ q: e.target.value })}
          />
          <button
            aria-label="Filtrar NFTs"
            aria-expanded={filtersOpen}
            aria-controls="catalog-filters"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <img
              src="/assets/kurio/mobile/filter.png"
              width="22"
              height="22"
              alt=""
            />
          </button>
        </div>
      )}
      <Hero />
      <section
        id="catalog"
        className="catalog-layout"
        aria-labelledby="catalog-title"
      >
        <h2 id="catalog-title" className="sr-only">
          Catálogo de NFTs
        </h2>
        <aside className="catalog-sidebar">
          <details
            id="catalog-filters"
            className="catalog-filters"
            open={!mobile || filtersOpen}
          >
            <summary>Filtrar NFTs</summary>
            {(!mobile || filtersOpen) && (
              <div className="filter-card">
                <h2>Coleções</h2>
                <Select
                  label="Coleção"
                  value={search.category}
                  onChange={(category) => update({ category })}
                >
                  <option value="">Todas as coleções</option>
                  <option value="Art">Arte digital</option>
                  <option value="Photography">Fotografia</option>
                  <option value="Collectibles">Colecionáveis</option>
                </Select>
                {mobile && (
                  <Select
                    label="Ordenar por:"
                    value={search.sort}
                    onChange={(sort) =>
                      update({ sort: sort as CatalogSearch["sort"] })
                    }
                  >
                    <option value="featured">Listados recentemente</option>
                    <option value="price-asc">Preço: menor primeiro</option>
                    <option value="price-desc">Preço: maior primeiro</option>
                  </Select>
                )}
                <div className="collection-links">
                  {[
                    ["Art", "Arte digital"],
                    ["Photography", "Fotografia"],
                    ["Collectibles", "Colecionáveis"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      aria-pressed={search.category === value}
                      onClick={() =>
                        update({
                          category: search.category === value ? "" : value,
                        })
                      }
                    >
                      {label}
                      <span>
                        ({value === "Art" ? 8 : value === "Photography" ? 8 : 8}
                        )
                      </span>
                    </button>
                  ))}
                </div>
                {!mobile && (
                  <Field
                    label="Buscar NFTs"
                    placeholder="Buscar arte ou criador"
                    value={search.q}
                    onChange={(e) => update({ q: e.target.value })}
                  />
                )}
                <form
                  className="price-filter"
                  onSubmit={(e) => {
                    e.preventDefault();
                    update({ min: Number(minPrice), max: Number(maxPrice) });
                  }}
                >
                  <h3>Faixa de preço</h3>
                  <div className="price-ranges">
                    <input
                      aria-label="Preço mínimo"
                      type="range"
                      min="0.02"
                      max="12.30"
                      step="0.01"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                    <input
                      aria-label="Preço máximo"
                      type="range"
                      min="0.02"
                      max="12.30"
                      step="0.01"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                  <p>
                    Preço: {minPrice.replace(".", ",")} –{" "}
                    {maxPrice.replace(".", ",")} ETH
                  </p>
                  <Button disabled={Number(minPrice) > Number(maxPrice)}>
                    Aplicar
                  </Button>
                </form>
                <div className="network-filter">
                  <h3>Rede</h3>
                  {["Ethereum", "Polygon", "Solana"].map((network) => (
                    <button
                      key={network}
                      aria-pressed={search.network === network}
                      onClick={() =>
                        update({
                          network:
                            search.network === network ? undefined : network,
                        })
                      }
                    >
                      {network}
                      <span>(8)</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </details>
          {!mobile && (
            <div className="featured-banner">
              <h3>NFT EM DESTAQUE</h3>
              <p>OFERTA LIMITADA</p>
              <Link to="/nfts/$nftId" params={{ nftId: "nft-2" }}>
                <img
                  src={assets["home/imgNftArtwork18"]}
                  alt="Sage Nomad #009 em destaque"
                  width="310"
                  height="368"
                  loading="lazy"
                />
              </Link>
            </div>
          )}
        </aside>
        <div className="catalog-content">
          <div className="catalog-toolbar">
            <div
              className="market-tabs"
              role="group"
              aria-label="Seleção do catálogo"
            >
              {(
                [
                  ["all", "Todos os NFTs"],
                  ["new", "Novos lançamentos"],
                  ["trending", "Em alta"],
                ] as const
              ).map(([view, label]) => (
                <button
                  key={view}
                  type="button"
                  aria-pressed={(search.view ?? "all") === view}
                  onClick={() =>
                    update({ view: view === "all" ? undefined : view })
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            {!mobile && (
              <Select
                label="Ordenar por:"
                value={search.sort}
                onChange={(sort) =>
                  update({ sort: sort as CatalogSearch["sort"] })
                }
              >
                <option value="featured">Listados recentemente</option>
                <option value="price-asc">Preço: menor primeiro</option>
                <option value="price-desc">Preço: maior primeiro</option>
              </Select>
            )}
          </div>
          <p className="result-count" role="status">
            {query.data ? `${query.data.total} artworks` : "Loading artworks"}
          </p>
          {query.isPending ? (
            <Loading />
          ) : query.isError ? (
            <ErrorState
              error={query.error}
              retry={() => void query.refetch()}
            />
          ) : query.data.items.length ? (
            <div className="nft-grid">
              {query.data.items.map((nft, index) => (
                <NftCard key={nft.id} nft={nft} priority={index < 2} />
              ))}
            </div>
          ) : (
            <div className="panel py-14 text-center">
              <h3>Nenhum NFT encontrado</h3>
              <p>Tente outra busca ou limpe os filtros.</p>
              <Button
                onClick={() => {
                  setMinPrice("0.02");
                  setMaxPrice("12.3");
                  update({
                    q: "",
                    category: "",
                    sort: "featured",
                    min: undefined,
                    max: undefined,
                    network: undefined,
                  });
                }}
              >
                Limpar filtros
              </Button>
            </div>
          )}
          <nav aria-label="Catalog pagination" className="catalog-pagination">
            <Button
              variant="outline"
              aria-label="Previous"
              disabled={search.page <= 1}
              onClick={() => update({ page: search.page - 1 })}
            >
              ‹
            </Button>
            {Array.from({ length: query.data?.pages ?? 1 }, (_, i) => (
              <Button
                key={i}
                variant={search.page === i + 1 ? "default" : "outline"}
                aria-label={`Page ${i + 1}`}
                aria-current={search.page === i + 1 ? "page" : undefined}
                onClick={() => update({ page: i + 1 })}
              >
                {i + 1}
              </Button>
            ))}

            <Button
              variant="outline"
              aria-label="Next"
              disabled={!query.data || search.page >= query.data.pages}
              onClick={() => update({ page: search.page + 1 })}
            >
              ›
            </Button>
          </nav>
          {query.isFetching && !query.isPending && (
            <p role="status" className="text-sm text-muted">
              Atualizando coleção…
            </p>
          )}
        </div>
      </section>
      {!mobile && <EditorialSections />}
      {mobile && !backdrop && <MobileNavigation />}
    </>
  );
}
export function NftCard({
  nft,
  priority = false,
}: {
  nft: Nft;
  priority?: boolean;
}) {
  const favorite = useFavorite();
  const navigate = useNavigate();
  const liked = favorite.query.data?.includes(nft.id) ?? false;
  return (
    <article className="nft-card">
      <Link to="/nfts/$nftId" params={{ nftId: nft.id }}>
        <div className="nft-card-image">
          {nft.rarity === "rare" && <span className="rare-badge">RARO</span>}
          <img
            src={nft.image}
            alt={`${nft.name}, digital artwork by ${nft.creator}`}
            width="258"
            height="300"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
          />
        </div>
        <h3>{nft.name}</h3>
        <p className="nft-price">{displayEth(nft.editions[0].price)}</p>
      </Link>
      <button
        className="card-favorite"
        aria-label={`${liked ? "Remover dos favoritos" : "Adicionar aos favoritos"}: ${nft.name}`}
        aria-pressed={liked}
        disabled={favorite.mutation.isPending}
        onClick={() => {
          if (!favorite.user)
            void navigate({
              to: "/login",
              search: { returnTo: `/nfts/${nft.id}` },
            });
          else favorite.mutation.mutate({ id: nft.id, active: !liked });
        }}
      >
        <Heart
          size={18}
          fill={liked ? "currentColor" : "none"}
          strokeWidth={1.25}
        />
      </button>
    </article>
  );
}
export function RelatedCollection({
  title = "Mais desta coleção",
}: {
  title?: string;
}) {
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: ["related-catalog"],
    queryFn: async ({ signal }) => {
      const search: CatalogSearch = {
        q: "",
        category: "",
        sort: "featured",
        page: 1,
      };
      const first = await api.catalog(search, signal);
      const second =
        first.pages > 1
          ? await api.catalog({ ...search, page: 2 }, signal)
          : null;
      // Keep the reference's first five cards; subsequent pages show other NFTs.
      return [...first.items, ...(second?.items ?? [])].slice(3, 18);
    },
  });
  if (!query.data?.length) return null;
  const pageCount = Math.ceil(query.data.length / 5);
  const activePage = Math.min(page, pageCount - 1);
  return (
    <section
      className="related-section"
      aria-label={title}
      aria-roledescription="carrossel"
    >
      <h2>{title}</h2>
      <div className="related-grid" aria-live="polite" aria-atomic="true">
        {query.data.slice(activePage * 5, activePage * 5 + 5).map((nft) => (
          <NftCard key={nft.id} nft={nft} />
        ))}
      </div>
      <div
        className="carousel-dots"
        role="group"
        aria-label="Páginas da coleção"
      >
        {Array.from({ length: pageCount }, (_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Página ${index + 1} da coleção`}
            aria-current={activePage === index ? "true" : undefined}
            onClick={() => setPage(index)}
          >
            <span aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}

function EditorialSections() {
  const [ape, sage, vessel, golden] = [
    assets["home/imgFrame136"],
    assets["home/imgNftArtwork18"],
    assets["home/imgNftArtwork05"],
    assets["home/imgNftArtwork09"],
  ];
  return (
    <>
      <section className="promo-grid">
        {[
          [
            ape,
            "Lançamentos gênesis de edição limitada",
            "Colecione edições escassas diretamente dos criadores antes da revelação pública.",
          ],
          [
            vessel,
            "Arte digital selecionada e muito mais",
            "Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.",
          ],
        ].map(([image, title, text]) => (
          <article key={title} className="promo-card">
            <img src={image} alt="" width="292" height="250" loading="lazy" />
            <div>
              <h2>{title}</h2>
              <p>{text}</p>
              <Button asChild>
                <a href="#catalog">
                  Explorar <FigmaIcon name="home/imgArrowRight" />
                </a>
              </Button>
            </div>
          </article>
        ))}
      </section>
      <section id="creators" className="editorial-section">
        <h2>Diário da Cunhagem</h2>
        <p>
          Histórias, guias e insights para colecionadores sobre o universo da
          propriedade digital.
        </p>
        <div className="editorial-grid">
          {[
            [
              vessel,
              "Como funciona a propriedade de NFTs",
              "Aprenda a colecionar, negociar e verificar ativos digitais.",
            ],
            [
              ape,
              "10 artistas digitais para acompanhar",
              "Conheça criadores que moldam a cultura digital.",
            ],
            [
              sage,
              "Raridade, atributos e procedência",
              "Entenda raridade, procedência, direitos autorais e utilidade.",
            ],
            [
              golden,
              "Como proteger sua carteira",
              "Proteja sua carteira, suas chaves e sua coleção.",
            ],
          ].map(([image, title, text], index) => (
            <article key={title}>
              <img src={image} alt="" width="268" height="195" loading="lazy" />
              <div>
                <p>12 de setembro | Leitura de {index + 2} min</p>
                <h3>{title}</h3>
                <p>{text}</p>
                <details>
                  <summary>Ler mais →</summary>
                  <p>
                    Esta é uma demonstração de marketplace. NFTs representam
                    registros de propriedade; verifique rede, contrato, direitos
                    de uso e procedência antes de adquirir um ativo real. Nunca
                    compartilhe sua frase de recuperação.
                  </p>
                </details>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
