import { ws } from "msw";
import { toSocketIo } from "@mswjs/socket.io-binding";
import {
  account,
  db,
  nextId,
  save,
  setNotifier,
  settleOrders,
} from "./database";
import { setDemoEvent } from "./handlers";
const link = ws.link("wss://realtime.jungle.test/");
type Connection = ReturnType<typeof toSocketIo>;
const peers = new Map<
  Connection["rawClient"],
  { userId: string | null; io: Connection }
>();
let last: { name: string; data: Record<string, unknown> } | null = null;
function emit(name: string, data: Record<string, unknown>) {
  last = { name, data: structuredClone(data) };
  for (const context of peers.values())
    if (!data.userId || data.userId === context.userId)
      context.io.client.emit(name, data);
}
setNotifier((name, data) => emit(name, data as Record<string, unknown>));
setDemoEvent((kind) => {
  if (kind === "reset") {
    last = null;
    for (const peer of peers.keys()) peer.close(1012, "Demo reset");
    peers.clear();
    return;
  }
  if (kind === "disconnect") {
    for (const peer of peers.keys())
      peer.close(1012, "Simulated connection interruption");
    return;
  }
  if (kind === "duplicate" && last) emit(last.name, last.data);
  if (kind === "old" && last) {
    const stale = structuredClone(last.data);
    stale.eventId = nextId("old");
    stale.version = Math.max(0, Number(stale.version) - 1);
    if (stale.nft) {
      const nft = stale.nft as {
        version: number;
        editions: { price: string; available: number }[];
      };
      nft.version = Number(stale.version);
      nft.editions[0].price = "0.01";
      nft.editions[0].available = 99;
    }
    if (stale.order) {
      const order = stale.order as { version: number; status: string };
      order.version = Number(stale.version);
      order.status = "pending";
    }
    emit(last.name, stale);
  }
  if (kind === "settle") {
    db().orders.forEach((o) => (o.dueAt = 0));
    settleOrders();
    save();
  }
});
export const socketHandler = link.addEventListener(
  "connection",
  (connection) => {
    const io = toSocketIo(connection);
    const peer = io.rawClient;
    peers.set(peer, { userId: account()?.user.id ?? null, io });
    const timer = setInterval(settleOrders, 250);
    // The published binding 0.2 wraps handshakes/events; heartbeat is explicit Engine.IO text.
    const heartbeat = setInterval(() => peer.send("2"), 10000);
    peer.addEventListener("close", () => {
      clearInterval(timer);
      clearInterval(heartbeat);
      peers.delete(peer);
    });
  },
);
