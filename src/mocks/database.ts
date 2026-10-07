import type {
  Cart,
  CheckoutInput,
  Nft,
  Order,
  Quote,
  Scenario,
  Session,
  User,
  Wallet,
} from "../api/contracts";
import { eth, wei } from "../lib/money";
import { catalog, initialWallets, users } from "./fixtures";
const DB_KEY = "jungle.mock.db.v2";
const SESSION_KEY = "jungle.session.token";
export interface Account {
  user: User;
  passwordHash: string;
  salt: string;
  favorites: string[];
  wallets: Wallet[];
}
interface StoredOrder {
  order: Order;
  key: string;
  payload: string;
  dueAt: number;
  declined: boolean;
  reserved: boolean;
}
export interface Database {
  schema: 1;
  nfts: Nft[];
  accounts: Account[];
  carts: Record<string, Cart>;
  sessions: Record<string, { userId: string; expiresAt: number }>;
  orders: StoredOrder[];
  scenario: Scenario;
  sequence: number;
}
let database: Database;
export let notify: (
  name: "nft.updated" | "order.updated",
  data: unknown,
) => void = () => {};
export function setNotifier(fn: typeof notify) {
  notify = fn;
}
export async function hashPassword(password: string, salt: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(salt),
      iterations: 10000,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return Array.from(new Uint8Array(bits), (x) =>
    x.toString(16).padStart(2, "0"),
  ).join("");
}
export async function resetDatabase() {
  database = {
    schema: 1,
    nfts: structuredClone(catalog),
    accounts: await Promise.all(
      users.map(async (user) => ({
        user: structuredClone(user),
        salt: `fixture-${user.id}`,
        passwordHash: await hashPassword("Jungle123!", `fixture-${user.id}`),
        favorites: [],
        wallets: initialWallets(user.id),
      })),
    ),
    carts: {},
    sessions: {},
    orders: [],
    scenario: "standard",
    sequence: 0,
  };
  localStorage.removeItem(SESSION_KEY);
  for (const key of Object.keys(localStorage))
    if (key.startsWith("jungle.attempt.")) localStorage.removeItem(key);
  save();
}
export async function initialize() {
  try {
    const stored = JSON.parse(localStorage.getItem(DB_KEY) ?? "null");
    if (stored?.schema === 1) {
      database = stored;
      // Refresh artwork metadata without resetting accounts, orders, stock or prices.
      for (const nft of database.nfts) {
        const reference = catalog.find((item) => item.id === nft.id);
        if (reference) {
          nft.images = reference.images;
          nft.image = reference.image;
          nft.rarity ??= reference.rarity;
          nft.summary ??= reference.summary;
        }
      }
      save();
    } else await resetDatabase();
  } catch {
    await resetDatabase();
  }
}
export function db() {
  return database;
}
export function save() {
  localStorage.setItem(DB_KEY, JSON.stringify(database));
}
export function nextId(prefix: string) {
  database.sequence++;
  return `${prefix}-${database.sequence}`;
}
export function account(token = localStorage.getItem(SESSION_KEY)) {
  const session = token ? database.sessions[token] : undefined;
  if (!session || session.expiresAt <= Date.now()) return undefined;
  return database.accounts.find((a) => a.user.id === session.userId);
}
export function session(token = localStorage.getItem(SESSION_KEY)): Session {
  const a = account(token);
  return {
    user: a?.user ?? null,
    expiresAt: a && token ? database.sessions[token].expiresAt : null,
  };
}
export function login(a: Account) {
  const token = crypto.randomUUID();
  database.sessions[token] = {
    userId: a.user.id,
    expiresAt: Date.now() + 30 * 60 * 1000,
  };
  localStorage.setItem(SESSION_KEY, token);
  const guest = database.carts.guest;
  if (guest?.items.length) {
    const own = cart(a.user.id);
    for (const item of guest.items) {
      const edition = database.nfts
        .find((n) => n.id === item.nftId)
        ?.editions.find((e) => e.id === item.editionId);
      if (!edition || !edition.available) continue;
      const current = own.items.find(
        (i) => i.nftId === item.nftId && i.editionId === item.editionId,
      );
      if (current)
        current.quantity = Math.min(
          edition.available,
          current.quantity + item.quantity,
        );
      else
        own.items.push({
          ...item,
          quantity: Math.min(edition.available, item.quantity),
        });
    }
    own.version++;
    delete database.carts.guest;
  }
  save();
  return session();
}
export function logout(token = localStorage.getItem(SESSION_KEY)) {
  if (token) delete database.sessions[token];
  if (token === localStorage.getItem(SESSION_KEY))
    localStorage.removeItem(SESSION_KEY);
  save();
}
export function expire(token = localStorage.getItem(SESSION_KEY)) {
  if (token && database.sessions[token]) database.sessions[token].expiresAt = 0;
  save();
}
export function owner() {
  return account()?.user.id ?? "guest";
}
export function cart(userId = owner()): Cart {
  return (database.carts[userId] ??= { items: [], coupon: "", version: 1 });
}
export function quote(userId = owner()): Quote {
  const current = cart(userId);
  const issues: string[] = [];
  const lines = current.items.flatMap((item) => {
    const nft = database.nfts.find((n) => n.id === item.nftId);
    const edition = nft?.editions.find((e) => e.id === item.editionId);
    if (!nft || !edition) {
      issues.push("An item is no longer available.");
      return [];
    }
    if (item.quantity > edition.available)
      issues.push(
        `${nft.name}: only ${edition.available} available. Please update your cart.`,
      );
    return [
      {
        ...item,
        name: nft.name,
        edition: edition.name,
        image: nft.image,
        unitPrice: edition.price,
        total: eth(wei(edition.price) * BigInt(item.quantity)),
        available: edition.available,
      },
    ];
  });
  const subtotal = lines.reduce((sum, item) => sum + wei(item.total), 0n);
  if (current.coupon && !["JUNGLE10", "EXPIRED"].includes(current.coupon))
    issues.push("Coupon is no longer valid.");
  if (
    current.coupon === "EXPIRED" ||
    (database.scenario === "expired-coupon" && current.coupon)
  )
    issues.push("Your coupon has expired. Remove it to continue.");
  const discount =
    current.coupon === "JUNGLE10" && !issues.length ? subtotal / 10n : 0n;
  const fee = lines.length ? wei("0.016") : 0n;
  const signature = JSON.stringify({
    lines,
    coupon: current.coupon,
    discount: eth(discount),
    fee: eth(fee),
    issues,
  });
  return {
    id: signature,
    signature,
    lines,
    subtotal: eth(subtotal),
    discount: eth(discount),
    fee: eth(fee),
    total: eth(subtotal - discount + fee),
    coupon: current.coupon,
    issues,
  };
}
export function updateNft(kind: "price" | "stock") {
  const item = cart().items[0];
  const nft =
    database.nfts.find((n) => n.id === item?.nftId) ?? database.nfts[0];
  const edition =
    nft.editions.find((e) => e.id === item?.editionId) ?? nft.editions[0];
  if (kind === "price") edition.price = eth(wei(edition.price) + wei("0.05"));
  else edition.available = 0;
  nft.version++;
  save();
  notify("nft.updated", {
    eventId: nextId("event"),
    resourceId: nft.id,
    version: nft.version,
    nft: structuredClone(nft),
  });
  save();
}
export function settleOrders() {
  for (const stored of database.orders) {
    if (stored.order.status !== "pending" || stored.dueAt > Date.now())
      continue;
    const order = stored.order;
    order.status = stored.declined ? "declined" : "confirmed";
    order.version++;
    if (stored.declined) {
      order.reason =
        "The simulated wallet declined this payment. Your cart is preserved.";
      for (const line of order.quote.lines) {
        const nft = database.nfts.find((n) => n.id === line.nftId)!;
        nft.editions.find((e) => e.id === line.editionId)!.available +=
          line.quantity;
        nft.version++;
        notify("nft.updated", {
          eventId: nextId("event"),
          resourceId: nft.id,
          version: nft.version,
          nft: structuredClone(nft),
        });
      }
    } else {
      order.transaction = `0x${order.id.replace("order-", "").padStart(64, "0")}`;
      const current = cart(order.userId);
      for (const line of order.quote.lines) {
        const existing = current.items.find(
          (i) => i.nftId === line.nftId && i.editionId === line.editionId,
        );
        if (existing)
          existing.quantity = Math.max(0, existing.quantity - line.quantity);
      }
      current.items = current.items.filter((i) => i.quantity > 0);
      if (!current.items.length) current.coupon = "";
      current.version++;
    }
    save();
    notify("order.updated", {
      eventId: nextId("event"),
      resourceId: order.id,
      version: order.version,
      userId: order.userId,
      order: structuredClone(order),
    });
  }
  save();
}
export function createOrder(
  input: CheckoutInput,
  key: string,
  userId: string,
): Order {
  const current = quote(userId);
  const wallet = database.accounts
    .find((a) => a.user.id === userId)!
    .wallets.find((w) => w.id === input.walletId)!;
  const order: Order = {
    id: nextId("order"),
    userId,
    status: "pending",
    version: 1,
    quote: structuredClone(current),
    collector: structuredClone(input.collector),
    wallet: structuredClone(wallet),
    transaction: null,
    createdAt: Date.now(),
  };
  for (const line of current.lines) {
    const nft = database.nfts.find((n) => n.id === line.nftId)!;
    nft.editions.find((e) => e.id === line.editionId)!.available -=
      line.quantity;
    nft.version++;
    notify("nft.updated", {
      eventId: nextId("event"),
      resourceId: nft.id,
      version: nft.version,
      nft: structuredClone(nft),
    });
  }
  database.orders.push({
    order,
    key,
    payload: JSON.stringify(input),
    dueAt: Date.now() + 1800,
    declined: database.scenario === "declined",
    reserved: true,
  });
  save();
  return order;
}
