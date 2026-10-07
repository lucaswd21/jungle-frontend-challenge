export type Eth = string;
export type Network = "Ethereum" | "Polygon";
export interface Edition {
  id: string;
  name: string;
  price: Eth;
  available: number;
}
export interface Nft {
  rarity?: "standard" | "rare";
  network?: string;
  id: string;
  name: string;
  creator: string;
  category: string;
  image: string;
  images?: string[];
  description: string;
  summary?: string;
  editions: Edition[];
  version: number;
}
export interface CatalogSearch {
  view?: "all" | "new" | "trending";
  min?: number;
  max?: number;
  network?: string;
  q: string;
  category: string;
  sort: "featured" | "price-asc" | "price-desc";
  page: number;
}
export interface Page<T> {
  items: T[];
  total: number;
  pages: number;
}
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  username?: string;
  ens?: string;
  walletAlias?: string;
}
export interface Session {
  user: User | null;
  expiresAt: number | null;
}
export interface CartItem {
  nftId: string;
  editionId: string;
  quantity: number;
}
export interface Cart {
  items: CartItem[];
  coupon: string;
  version: number;
}
export interface QuoteLine extends CartItem {
  name: string;
  edition: string;
  image: string;
  unitPrice: Eth;
  total: Eth;
  available: number;
}
export interface Quote {
  id: string;
  lines: QuoteLine[];
  subtotal: Eth;
  discount: Eth;
  fee: Eth;
  total: Eth;
  coupon: string;
  signature: string;
  issues: string[];
}
export interface Wallet {
  id: string;
  label: string;
  address: string;
  network: Network;
  primary: boolean;
  displayName?: string;
  profileName?: string;
  email?: string;
  provider?: "MetaMask" | "WalletConnect" | "Coinbase Wallet";
  referral?: string;
  ens?: string;
  secondary?: string;
}
export interface CheckoutInput {
  quoteId: string;
  walletId: string;
  network: Network;
  collector: {
    name: string;
    email: string;
    username: string;
    profileName: string;
    address: string;
    secondary: string;
    provider: "MetaMask" | "WalletConnect" | "Coinbase Wallet";
    referral: string;
    ensSuffix: ".eth";
    note: string;
  };
  connected: boolean;
}
export interface Order {
  id: string;
  userId: string;
  status: "pending" | "confirmed" | "declined";
  version: number;
  quote: Quote;
  collector: CheckoutInput["collector"];
  wallet: Wallet;
  transaction: string | null;
  createdAt: number;
  reason?: string;
}
export interface ApiError {
  code: string;
  message: string;
  fields?: Record<string, string>;
}
export interface ResourceEvent {
  eventId: string;
  resourceId: string;
  version: number;
  userId?: string;
}
export interface NftEvent extends ResourceEvent {
  nft: Nft;
}
export interface OrderEvent extends ResourceEvent {
  order: Order;
  userId: string;
}
export const SCENARIOS = [
  "standard",
  "empty",
  "slow",
  "variable",
  "offline",
  "server-error",
  "invalid-cart",
  "html-response",
  "unauthorized",
  "expired",
  "signup-conflict",
  "validation",
  "invalid-coupon",
  "expired-coupon",
  "price-change",
  "sold-out",
  "timeout",
  "declined",
  "favorite-failure",
] as const;
export type Scenario = (typeof SCENARIOS)[number];
