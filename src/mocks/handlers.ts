import { delay, http, HttpResponse } from "msw";
import type {
  CartItem,
  CheckoutInput,
  Scenario,
  User,
  Wallet,
} from "../api/contracts";
import { SCENARIOS } from "../api/contracts";
import { wei } from "../lib/money";
import {
  account,
  cart,
  createOrder,
  db,
  expire,
  hashPassword,
  login,
  logout,
  nextId,
  quote,
  resetDatabase,
  save,
  session,
  settleOrders,
  updateNft,
} from "./database";
const json = HttpResponse.json;
const fail = (
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>,
) => json({ code, message, fields }, { status });
const tokenFor = (request: Request) =>
  request.headers.get("Authorization")?.replace(/^Bearer /, "") ?? "";
const requestAccount = (request: Request) => account(tokenFor(request));
const cartFor = (request: Request) =>
  cart(requestAccount(request)?.user.id ?? "guest");
const quoteFor = (request: Request) =>
  quote(requestAccount(request)?.user.id ?? "guest");
function privateAccess(request: Request) {
  return !requestAccount(request)
    ? fail(
        401,
        "SESSION_EXPIRED",
        "Entre novamente para continuar. Seu progresso foi preservado.",
      )
    : null;
}
const emailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
let latencySequence = 0;
let changed = false;
/** All faults occur in network handlers. Components never fabricate business responses. */
async function before(request: Request, privateRoute = false) {
  const scenario = db().scenario;
  if (scenario === "slow") await delay(2000);
  else if (scenario === "variable")
    await delay(++latencySequence % 2 ? 900 : 80);
  if (scenario === "offline") return HttpResponse.error();
  if (scenario === "server-error")
    return fail(
      503,
      "UNAVAILABLE",
      "O mercado está temporariamente indisponível. Tente novamente.",
    );
  if (privateRoute && scenario === "expired") expire(tokenFor(request));
  if (privateRoute && scenario === "unauthorized")
    return fail(
      403,
      "FORBIDDEN",
      "Você não tem permissão para acessar este recurso.",
    );
  if (privateRoute) return privateAccess(request);
  // Request is accepted to make the network interception boundary explicit.
  void request;
  return null;
}
export const handlers = [
  http.get("/api/_mock-health", () => json({ transport: "jungle-msw" })),
  http.post("/api/demo/reset", async () => {
    changed = false;
    latencySequence = 0;
    demoEvent("reset");
    await resetDatabase();
    return json({ ok: true });
  }),
  http.post("/api/demo/scenario", async ({ request }) => {
    const { scenario } = (await request.json()) as { scenario: Scenario };
    if (!SCENARIOS.includes(scenario))
      return fail(422, "VALIDATION", "Unknown scenario.");
    db().scenario = scenario;
    changed = false;
    save();
    return json({ scenario });
  }),
  http.post("/api/demo/event", async ({ request }) => {
    const { kind } = (await request.json()) as { kind: string };
    if (kind === "expire") expire();
    else if (kind === "price" || kind === "stock") updateNft(kind);
    // Remaining events are handled by the socket mock through its emitter.
    else demoEvent(kind);
    return json({ ok: true });
  }),
  http.get("/api/session", async ({ request }) => {
    const error = await before(request);
    if (error) return error;
    if (db().scenario === "expired") expire(tokenFor(request));
    return json(session(tokenFor(request)));
  }),
  http.post("/api/session", async ({ request }) => {
    const error = await before(request);
    if (error) return error;
    const { email, password } = (await request.json()) as {
      email: string;
      password: string;
    };
    const a = db().accounts.find(
      (a) => a.user.email.toLowerCase() === email?.toLowerCase(),
    );
    if (
      !a ||
      typeof password !== "string" ||
      a.passwordHash !== (await hashPassword(password, a.salt))
    )
      return fail(422, "INVALID_CREDENTIALS", "E-mail ou senha incorretos.", {
        password: "Confira suas credenciais.",
      });
    return json(login(a));
  }),
  http.delete("/api/session", ({ request }) => {
    logout(tokenFor(request));
    return json({ ok: true });
  }),
  http.post("/api/accounts", async ({ request }) => {
    const error = await before(request);
    if (error) return error;
    const { name, email, password } = (await request.json()) as {
      name: string;
      email: string;
      password: string;
    };
    const fields: Record<string, string> = {};
    if (!name?.trim() || name.length > 80)
      fields.name = "Digite um nome de 1 a 80 caracteres.";
    if (!emailValid(email ?? "")) fields.email = "Digite um e-mail válido.";
    if (typeof password !== "string" || password.length < 8)
      fields.password = "Use pelo menos 8 caracteres.";
    if (Object.keys(fields).length)
      return fail(
        422,
        "VALIDATION",
        "Por favor, corrija os campos destacados.",
        fields,
      );
    if (
      db().scenario === "signup-conflict" ||
      db().accounts.some(
        (a) => a.user.email.toLowerCase() === email.toLowerCase(),
      )
    )
      return fail(409, "EMAIL_CONFLICT", "Este e-mail já está cadastrado.", {
        email: "Try signing in instead.",
      });
    const id = nextId("user");
    const salt = crypto.randomUUID();
    const a = {
      user: {
        id,
        name: name.trim(),
        email: email.toLowerCase(),
        avatar: "",
        bio: "",
      },
      salt,
      passwordHash: await hashPassword(password, salt),
      wallets: [],
      favorites: [],
    };
    db().accounts.push(a);
    return json(login(a), { status: 201 });
  }),
  http.get("/api/nfts", async ({ request }) => {
    const error = await before(request);
    if (error) return error;
    const params = new URL(request.url).searchParams;
    for (const key of ["min", "max"]) {
      const value = params.get(key);
      if (value && (!/^\d+(\.\d{1,2})?$/.test(value) || Number(value) > 10000))
        return fail(400, "INVALID_FILTER", "Invalid price filter.");
    }
    const q = (params.get("q") ?? "").toLowerCase();
    const category = params.get("category");
    let items =
      db().scenario === "empty"
        ? []
        : db().nfts.filter(
            (n) =>
              `${n.name} ${n.creator}`.toLowerCase().includes(q) &&
              (!category || n.category === category) &&
              (!params.get("network") || n.network === params.get("network")) &&
              (!params.get("min") ||
                wei(n.editions[0].price) >= wei(params.get("min")!)) &&
              (!params.get("max") ||
                wei(n.editions[0].price) <= wei(params.get("max")!)),
          );
    const sort = params.get("sort");
    // Stable fixture metadata: the first half are recent listings; popularity is deterministic.
    const view = params.get("view");
    if (view === "new") items = items.filter((n) => db().nfts.indexOf(n) < 12);
    if (view === "trending")
      items = [...items].sort(
        (a, b) =>
          ((Number(b.id.split("-")[1]) * 7) % 25) -
          ((Number(a.id.split("-")[1]) * 7) % 25),
      );
    if (sort === "price-asc" || sort === "price-desc")
      items = [...items].sort((a, b) => {
        const diff = wei(a.editions[0].price) - wei(b.editions[0].price);
        return (
          (diff < 0n ? -1 : diff > 0n ? 1 : 0) *
          (sort === "price-desc" ? -1 : 1)
        );
      });
    const pages = Math.max(1, Math.ceil(items.length / 9));
    const page = Math.max(1, Number(params.get("page")) || 1);
    return json({
      items: items.slice((page - 1) * 9, page * 9),
      total: items.length,
      pages,
    });
  }),
  http.get("/api/nfts/:id", async ({ request, params }) => {
    const error = await before(request);
    if (error) return error;
    const nft = db().nfts.find((n) => n.id === params.id);
    return nft
      ? json(nft)
      : fail(404, "NOT_FOUND", "Este NFT não foi encontrado.");
  }),
  http.get("/api/favorites", async ({ request }) => {
    const error = await before(request, true);
    return error ?? json(requestAccount(request)!.favorites);
  }),
  http.post("/api/favorites", async ({ request }) => {
    const error = await before(request, true);
    if (error) return error;
    if (db().scenario === "favorite-failure")
      return fail(
        503,
        "UNAVAILABLE",
        "Não foi possível salvar o favorito. A seleção anterior foi restaurada.",
      );
    const { id, active } = (await request.json()) as {
      id: string;
      active: boolean;
    };
    if (!db().nfts.some((n) => n.id === id))
      return fail(404, "NOT_FOUND", "NFT not found.");
    const a = requestAccount(request)!;
    a.favorites = active
      ? [...new Set([...a.favorites, id])]
      : a.favorites.filter((n) => n !== id);
    save();
    return json(a.favorites);
  }),
  http.get("/api/cart", async ({ request }) => {
    const error = await before(request);
    if (error) return error;
    if (db().scenario === "invalid-cart") return json({ unexpected: true });
    if (db().scenario === "html-response")
      return HttpResponse.html("<!doctype html><title>Fallback</title>");
    return error ?? json(cartFor(request));
  }),
  ...(["post", "patch", "delete"] as const).map((method) =>
    http[method]("/api/cart/items", async ({ request }) => {
      const error = await before(request);
      if (error) return error;
      const item = (await request.json()) as CartItem;
      const nft = db().nfts.find((n) => n.id === item.nftId);
      const edition = nft?.editions.find((e) => e.id === item.editionId);
      const current = cartFor(request);
      const existing = current.items.find(
        (i) => i.nftId === item.nftId && i.editionId === item.editionId,
      );
      if (method === "delete") {
        current.items = current.items.filter((i) => i !== existing);
      } else {
        const quantity =
          method === "post"
            ? item.quantity + (existing?.quantity ?? 0)
            : item.quantity;
        if (!edition)
          return fail(404, "NOT_FOUND", "This edition no longer exists.");
        if (!Number.isInteger(quantity) || quantity < 1)
          return fail(
            422,
            "VALIDATION",
            "Quantity must be a positive integer.",
          );
        if (quantity > edition.available)
          return fail(
            409,
            "STOCK_CONFLICT",
            `Only ${edition.available} editions available.`,
          );
        if (existing) existing.quantity = quantity;
        else current.items.push({ ...item, quantity });
      }
      if (!current.items.length) current.coupon = "";
      current.version++;
      save();
      return json(current);
    }),
  ),
  http.get("/api/quote", async ({ request }) => {
    const error = await before(request);
    return error ?? json(quoteFor(request));
  }),
  http.post("/api/quote/coupon", async ({ request }) => {
    const error = await before(request);
    if (error) return error;
    const { code } = (await request.json()) as { code: string };
    const normalized = code?.trim().toUpperCase();
    if (
      normalized === "EXPIRED" ||
      (db().scenario === "expired-coupon" && normalized)
    )
      return fail(422, "COUPON_EXPIRED", "Este cupom expirou.");
    if (
      (normalized && normalized !== "JUNGLE10") ||
      (db().scenario === "invalid-coupon" && normalized)
    )
      return fail(
        422,
        "COUPON_INVALID",
        "Este cupom é inválido. Experimente JUNGLE10.",
      );
    cartFor(request).coupon = normalized;
    cartFor(request).version++;
    save();
    return json(quoteFor(request));
  }),
  http.post("/api/orders", async ({ request }) => {
    const error = await before(request, true);
    if (error) return error;
    settleOrders();
    const input = (await request.json()) as CheckoutInput;
    const key = request.headers.get("Idempotency-Key");
    if (!key || key.length > 120)
      return fail(
        422,
        "IDEMPOTENCY_REQUIRED",
        "A valid idempotency key is required.",
      );
    const stored = db().orders.find(
      (o) =>
        o.key === key && o.order.userId === requestAccount(request)!.user.id,
    );
    if (stored)
      return stored.payload === JSON.stringify(input)
        ? json(stored.order)
        : fail(
            409,
            "IDEMPOTENCY_CONFLICT",
            "This attempt key belongs to a different order.",
          );
    if (!changed && ["price-change", "sold-out"].includes(db().scenario)) {
      changed = true;
      updateNft(db().scenario === "price-change" ? "price" : "stock");
    }
    const current = quoteFor(request);
    if (current.id !== input.quoteId || current.issues.length)
      return fail(
        409,
        "QUOTE_CHANGED",
        "Preço ou disponibilidade alterados. Revise a cotação atualizada e confirme novamente.",
      );
    if (!current.lines.length)
      return fail(422, "EMPTY_CART", "Add an NFT before checking out.");
    const wallet = requestAccount(request)!.wallets.find(
      (w) => w.id === input.walletId,
    );
    const fields: Record<string, string> = {};
    if (!input.collector?.name?.trim()) fields.name = "Digite seu nome.";
    if (!emailValid(input.collector?.email ?? ""))
      fields.email = "Digite um e-mail válido.";
    if (!/^[a-zA-Z0-9_.-]{2,32}$/.test(input.collector?.username ?? ""))
      fields.username =
        "Use de 2 a 32 letras, números, pontos, hífens ou sublinhados.";
    if (
      !input.collector?.profileName?.trim() ||
      input.collector.profileName.length > 80
    )
      fields.profileName = "Digite um nome de perfil de 1 a 80 caracteres.";
    if (input.collector?.address !== wallet?.address)
      fields.address = "Use o endereço da carteira cadastrada selecionada.";
    if (!/^[a-zA-Z0-9_-]{1,32}$/.test(input.collector?.referral ?? ""))
      fields.referral =
        "Use um código de 1 a 32 letras, números, hífens ou sublinhados.";
    if (
      input.collector?.secondary &&
      !/^(0x[a-fA-F0-9]{40}|[a-z0-9-]+\.eth)$/.test(input.collector.secondary)
    )
      fields.secondary = "Use um endereço 0x válido ou um nome .eth.";
    if (input.collector?.note?.length > 500)
      fields.note = "Use até 500 caracteres.";
    if (
      !["MetaMask", "WalletConnect", "Coinbase Wallet"].includes(
        input.collector?.provider,
      ) ||
      input.collector?.ensSuffix !== ".eth"
    )
      fields.wallet = "Select a supported demo provider and ENS suffix.";
    if (!wallet || wallet.network !== input.network)
      fields.wallet = "Escolha uma carteira na rede selecionada.";
    if (!input.connected)
      fields.wallet = "Conecte a carteira antes de continuar.";
    if (Object.keys(fields).length)
      return fail(
        422,
        "VALIDATION",
        "Confira os dados do colecionador e da carteira.",
        fields,
      );
    const order = createOrder(input, key, requestAccount(request)!.user.id);
    if (db().scenario === "timeout") {
      await delay(8000);
      settleOrders();
    }
    return json(order, { status: 201 });
  }),
  http.get("/api/orders/attempt/:key", async ({ request, params }) => {
    const error = await before(request, true);
    if (error) return error;
    settleOrders();
    const stored = db().orders.find(
      (o) =>
        o.key === params.key &&
        o.order.userId === requestAccount(request)!.user.id,
    );
    return stored
      ? json(stored.order)
      : fail(404, "NOT_FOUND", "No order was created for this attempt.");
  }),
  http.get("/api/orders/:id", async ({ request, params }) => {
    const error = await before(request, true);
    if (error) return error;
    settleOrders();
    const stored = db().orders.find((o) => o.order.id === params.id);
    if (!stored) return fail(404, "NOT_FOUND", "Order not found.");
    if (stored.order.userId !== requestAccount(request)!.user.id)
      return fail(403, "FORBIDDEN", "This order belongs to another collector.");
    return json(stored.order);
  }),
  http.get("/api/profile", async ({ request }) => {
    const error = await before(request, true);
    return error ?? json(requestAccount(request)!.user);
  }),
  http.patch("/api/profile", async ({ request }) => {
    const error = await before(request, true);
    if (error) return error;
    const data = (await request.json()) as Pick<
      User,
      "name" | "email" | "avatar" | "bio" | "username" | "ens" | "walletAlias"
    >;
    const fields: Record<string, string> = {};
    if (!data.name?.trim() || data.name.length > 80)
      fields.name = "Digite um nome de 1 a 80 caracteres.";
    if (!emailValid(data.email ?? ""))
      fields.email = "Digite um e-mail válido.";
    if (
      data.username !== undefined &&
      !/^[a-zA-Z0-9_.-]{2,32}$/.test(data.username)
    )
      fields.username =
        "Use de 2 a 32 letras, números, pontos, hífens ou sublinhados.";
    if (data.ens && !/^[a-z0-9-]+\.eth$/.test(data.ens))
      fields.ens = "Use um nome .eth válido.";
    if (
      data.walletAlias !== undefined &&
      (!data.walletAlias.trim() || data.walletAlias.length > 40)
    )
      fields.walletAlias = "Use um apelido de 1 a 40 caracteres.";
    if (data.bio?.length > 280) fields.bio = "Use até 280 caracteres.";
    if (
      data.avatar &&
      (!/^data:image\/(png|jpeg|webp);base64,/.test(data.avatar) ||
        data.avatar.length > 700000)
    )
      fields.avatar = "Use uma imagem PNG, JPEG ou WebP com menos de 500 KB.";
    if (
      db().accounts.some(
        (a) =>
          a.user.id !== requestAccount(request)!.user.id &&
          a.user.email.toLowerCase() === data.email?.toLowerCase(),
      )
    )
      fields.email = "Este e-mail já está cadastrado.";
    if (db().scenario === "validation")
      fields.name = "This name is unavailable in the current scenario.";
    if (Object.keys(fields).length)
      return fail(
        422,
        "VALIDATION",
        "Por favor, corrija os campos destacados.",
        fields,
      );
    Object.assign(requestAccount(request)!.user, data, {
      name: data.name.trim(),
      email: data.email.toLowerCase(),
    });
    save();
    return json(requestAccount(request)!.user);
  }),
  http.post("/api/profile/password", async ({ request }) => {
    const error = await before(request, true);
    if (error) return error;
    const { current, password } = (await request.json()) as {
      current: string;
      password: string;
    };
    const a = requestAccount(request)!;
    if (a.passwordHash !== (await hashPassword(current ?? "", a.salt)))
      return fail(422, "VALIDATION", "A senha atual está incorreta.", {
        current: "Confira sua senha atual.",
      });
    if (!password || password.length < 8)
      return fail(422, "VALIDATION", "Use pelo menos 8 caracteres.", {
        password: "A senha é muito curta.",
      });
    a.salt = crypto.randomUUID();
    a.passwordHash = await hashPassword(password, a.salt);
    save();
    return json({ ok: true });
  }),
  http.post("/api/wallets/:id/connect", async ({ request, params }) => {
    const error = await before(request, true);
    if (error) return error;
    const data = (await request.json()) as {
      network: string;
      approve: boolean;
    };
    const wallet = requestAccount(request)!.wallets.find(
      (w) => w.id === params.id,
    );
    if (!wallet) return fail(404, "NOT_FOUND", "Wallet not found.");
    if (wallet.network !== data.network)
      return fail(422, "VALIDATION", "Wallet network does not match.");
    return json({ connected: data.approve });
  }),
  http.get("/api/wallets", async ({ request }) => {
    const error = await before(request, true);
    return error ?? json(requestAccount(request)!.wallets);
  }),
  http.post("/api/wallets", async ({ request }) => {
    const error = await before(request, true);
    if (error) return error;
    const data = (await request.json()) as Wallet;
    const a = requestAccount(request)!;
    const fields: Record<string, string> = {};
    if (!data.label?.trim())
      fields.label = "Digite um apelido para a carteira.";
    if (!/^0x[a-fA-F0-9]{40}$/.test(data.address ?? ""))
      fields.address = "Use um endereço 0x com 40 caracteres hexadecimais.";
    if (!["Ethereum", "Polygon"].includes(data.network))
      fields.network = "Selecione uma rede compatível.";
    if (data.id && !a.wallets.some((w) => w.id === data.id))
      return fail(404, "NOT_FOUND", "Wallet not found.");
    if (
      a.wallets.some(
        (w) =>
          w.id !== data.id &&
          w.address.toLowerCase() === data.address?.toLowerCase() &&
          w.network === data.network,
      )
    )
      fields.address = "Esta carteira já está cadastrada.";
    for (const field of ["displayName", "profileName"] as const)
      if (
        data[field] !== undefined &&
        (!data[field]?.trim() || data[field]!.length > 80)
      )
        fields[field] = "Use um nome de 1 a 80 caracteres.";
    if (data.email !== undefined && !emailValid(data.email))
      fields.email = "Digite um e-mail válido.";
    if (
      data.provider !== undefined &&
      !["MetaMask", "WalletConnect", "Coinbase Wallet"].includes(data.provider)
    )
      fields.provider = "Select a supported demo provider.";
    if (
      data.referral !== undefined &&
      !/^[a-zA-Z0-9_-]{1,32}$/.test(data.referral)
    )
      fields.referral =
        "Use um código de 1 a 32 letras, números, hífens ou sublinhados.";
    if (data.ens && !/^[a-z0-9-]+\.eth$/.test(data.ens))
      fields.ens = "Use um nome .eth válido.";
    if (
      data.secondary &&
      !/^(0x[a-fA-F0-9]{40}|[a-z0-9-]+\.eth)$/.test(data.secondary)
    )
      fields.secondary = "Use um endereço 0x válido ou um nome .eth.";
    if (!data.id && a.wallets.length >= 2)
      fields.label = "Edit one of your two existing wallets.";
    if (Object.keys(fields).length)
      return fail(422, "VALIDATION", "Corrija os campos da carteira.", fields);
    const wallet = {
      ...data,
      label: data.label.trim(),
      id: data.id || nextId("wallet"),
      primary: data.primary || !a.wallets.length,
    };
    if (wallet.primary) a.wallets.forEach((w) => (w.primary = false));
    const index = a.wallets.findIndex((w) => w.id === data.id);
    if (index >= 0) a.wallets[index] = wallet;
    else a.wallets.push(wallet);
    if (!a.wallets.some((w) => w.primary)) a.wallets[0].primary = true;
    save();
    return json(a.wallets);
  }),
];
let demoEvent: (kind: string) => void = () => {};
export function setDemoEvent(handler: typeof demoEvent) {
  demoEvent = handler;
}
