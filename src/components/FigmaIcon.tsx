import {
  ArrowRight,
  LogOut,
  Wallet,
  Heart,
  Globe,
  MessageCircle,
} from "lucide-react";
import assets from "../lib/figma-assets.json";

/** Use original exported SVGs where supplied; document remaining icon substitutions. */
export function FigmaIcon({ name }: { name: keyof typeof assets }) {
  const src = assets[name];
  if (src)
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        width={name === "home/imgLogout" ? 20 : 24}
        height={name === "home/imgLogout" ? 20 : 24}
        className="figma-icon"
      />
    );
  const Icon = name.includes("Arrow")
    ? ArrowRight
    : name.includes("Logout")
      ? LogOut
      : name.includes("Wallet")
        ? Wallet
        : name.includes("108")
          ? Heart
          : name.includes("109")
            ? MessageCircle
            : Globe;
  return <Icon aria-hidden="true" size={20} className="figma-icon" />;
}
