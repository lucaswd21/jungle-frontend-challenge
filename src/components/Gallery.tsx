import { useMobile } from "../lib/useMobile";
import { useState } from "react";
import type { Nft } from "../api/contracts";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Search } from "lucide-react";
export function Gallery({ nft }: { nft: Nft }) {
  const mobile = useMobile();
  const [selected, setSelected] = useState(0);
  const images = nft.images ?? [nft.image];
  const previews = (
    <div
      className="gallery-thumbnails mt-4 flex gap-3"
      aria-label="Galeria da obra"
    >
      {images.map((src, index) => (
        <button
          key={`${src}-${index}`}
          aria-label={`Ver imagem ${index + 1} da obra`}
          aria-pressed={selected === index}
          onClick={() => setSelected(index)}
          className={`rounded-xl border-2 p-1 ${selected === index ? "border-primary" : "border-transparent"}`}
        >
          <img
            src={src}
            alt=""
            width="64"
            height="64"
            loading="eager"
            decoding="sync"
            className="rounded-lg"
          />
        </button>
      ))}
    </div>
  );
  return (
    <div className="artwork-gallery">
      <Dialog>
        <DialogTrigger asChild>
          <button
            aria-label={`Ampliar ${nft.name}`}
            className="gallery-main block w-full rounded-3xl"
          >
            <img
              src={images[selected]}
              alt={`${nft.name} por ${nft.creator}`}
              width="640"
              height="640"
              fetchPriority="high"
              className="aspect-square w-full rounded-3xl object-cover"
            />
            {!mobile && (
              <span className="gallery-zoom" aria-hidden="true">
                <Search size={20} />
              </span>
            )}
          </button>
        </DialogTrigger>
        <DialogContent
          title={nft.name}
          description="Visualização ampliada da obra. Feche para voltar à seleção de edição."
        >
          <img
            src={images[selected]}
            alt={`${nft.name}, imagem ampliada`}
            width="640"
            height="640"
            className="aspect-square w-full rounded-xl"
          />
          <div className="gallery-dialog-previews">{previews}</div>
        </DialogContent>
      </Dialog>
      {!mobile && previews}
      <p className="mt-3 text-sm text-muted">
        Prévia da obra ·{" "}
        {(
          {
            Art: "Arte",
            Photography: "Fotografia",
            Collectibles: "Colecionáveis",
          } as Record<string, string>
        )[nft.category] ?? nft.category}
      </p>
    </div>
  );
}
