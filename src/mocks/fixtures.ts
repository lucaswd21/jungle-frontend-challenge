import type { Nft, User, Wallet } from "../api/contracts";
export const names = [
  "Emerald Ape #042",
  "Sage Nomad #009",
  "Neon Vessel #552",
  "Cosmic Bloom #118",
  "Violet Nomad #314",
  "Ivory Baron #088",
  "Golden Beat #207",
  "Golden Frequency #071",
  "Golden Signal #160",
  "Digital Soul",
  "Forest City",
  "Electric Waves",
  "Midnight Sun",
  "Soft Geometry",
  "Uncharted Space",
  "Prismatic Vision",
  "Echoes of Light",
  "Wild Imagination",
  "Crystal Form",
  "Ocean of Stars",
  "Paper Universe",
  "Infinite Loop",
  "Lunar Portrait",
  "The Last Paradise",
];
export const catalog: Nft[] = names.map((name, i) => ({
  id: `nft-${i + 1}`,
  rarity: i % 9 === 2 ? "rare" : "standard",
  name,
  creator: ["Alex Rivera", "Maya Chen", "Sam Nova", "Riley Park"][i % 4],
  category: ["Art", "Photography", "Collectibles"][i % 3],
  network: ["Ethereum", "Polygon", "Solana"][i % 3],
  image: `/assets/kurio/${["emerald", "sage", "vessel", "golden", "sage", "vessel", "golden", "golden", "golden"][i % 9]}.webp`,
  images:
    i === 0
      ? [
          "/assets/kurio/hero.webp",
          "/assets/kurio/emerald.webp",
          "/assets/kurio/hero.webp",
          "/assets/kurio/emerald.webp",
        ]
      : [
          `/assets/kurio/${["hero", "sage", "vessel", "golden", "sage", "vessel", "golden", "golden", "golden"][i % 9]}.webp`,
          "/assets/kurio/sage.webp",
          "/assets/kurio/vessel.webp",
          "/assets/kurio/golden.webp",
        ],
  summary: `Um colecionável digital 1/50 finalizado à mão da coleção Kurio Editions, verificado na ${["Ethereum", "Polygon", "Solana"][i % 3]}.`,
  description:
    "Um colecionável digital finalizado à mão da coleção Kurio Editions, com arte desbloqueável e acesso para colecionadores.",
  version: 1,
  editions: [
    {
      id: "standard",
      name: "1/50",
      price: [
        "1.19",
        "1.69",
        "1.99",
        "1.29",
        "1.39",
        "1.79",
        "0.99",
        "1.59",
        "0.39",
      ][i % 9],
      available: 8,
    },
    {
      id: "rare",
      name: "1/10",
      price: `1.${String(i).padStart(2, "0")}`,
      available: i === 2 ? 0 : 3,
    },
    { id: "unique", name: "1/1", price: "3.19", available: 1 },
    { id: "open", name: "ABERTA", price: "0.39", available: 20 },
  ],
}));
export const users: User[] = [
  {
    id: "alex",
    name: "Alex Colecionador",
    email: "alex@example.test",
    avatar: "",
    bio: "Collecting digital possibilities.",
  },
  {
    id: "maya",
    name: "Maya Colecionador",
    email: "maya@example.test",
    avatar: "",
    bio: "",
  },
];
export function initialWallets(userId: string): Wallet[] {
  return [
    {
      id: `wallet-${userId}`,
      label: "My main wallet",
      address: `0x${(userId === "alex" ? "a" : "b").repeat(40)}`,
      network: "Ethereum",
      primary: true,
    },
  ];
}
