import { Heart } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "./ui/dialog";
import { useCart, useFavorite } from "../features/hooks";
export function MobileNavigation() {
  const favorite = useFavorite();
  const cart = useCart();
  const count =
    cart.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <Link to="/" aria-label="Início">
        <img
          src="/assets/kurio/mobile/home.png"
          width="16"
          height="17"
          alt=""
        />
      </Link>
      <Dialog>
        <DialogTrigger asChild>
          <button aria-label="Favoritos">
            <Heart size={22} fill="currentColor" />
          </button>
        </DialogTrigger>
        <DialogContent
          title="Favoritos"
          description="NFTs salvos na sua conta de colecionador."
        >
          {favorite.user ? (
            favorite.query.isPending ? (
              <p role="status">Carregando favoritos…</p>
            ) : favorite.query.isError ? (
              <div role="alert">
                <p>Não foi possível carregar seus favoritos.</p>
                <button onClick={() => void favorite.query.refetch()}>
                  Tentar novamente
                </button>
              </div>
            ) : favorite.query.data?.length ? (
              <ul>
                {favorite.query.data.map((id) => (
                  <li key={id}>
                    <DialogClose asChild>
                      <Link to="/nfts/$nftId" params={{ nftId: id }}>
                        Ver NFT {id}
                      </Link>
                    </DialogClose>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhum NFT salvo. Use o coração no detalhe de uma obra.</p>
            )
          ) : (
            <DialogClose asChild>
              <Link to="/login">Entre para acessar seus favoritos.</Link>
            </DialogClose>
          )}
        </DialogContent>
      </Dialog>
      <Link
        className="mobile-center-action"
        to="/"
        hash="catalog"
        aria-label="Explorar NFTs"
      >
        <img
          src="/assets/kurio/mobile/explore.png"
          width="27"
          height="24"
          alt=""
        />
      </Link>
      <Link
        to="/cart"
        aria-label={`Carrinho (${count})`}
        className="mobile-cart-action"
      >
        <img
          src="/assets/kurio/mobile/cart.png"
          width="18"
          height="17"
          alt=""
        />
        {count > 0 && (
          <span
            className="mobile-cart-count"
            data-testid="mobile-cart-count"
            aria-hidden="true"
          >
            {count}
          </span>
        )}
      </Link>
      <Link to="/profile" aria-label="Meu perfil">
        <img
          src="/assets/kurio/mobile/account.png"
          width="14"
          height="17"
          alt=""
        />
      </Link>
    </nav>
  );
}
