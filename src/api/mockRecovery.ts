// Optional demo transport hook. Real-backend builds do not load MSW here.
let restart: (() => Promise<void>) | undefined;
let pending: Promise<void> | undefined;
let lastReadyAt = 0;
let verification: Promise<void> | undefined;
const IDLE_THRESHOLD = 30_000;

export function configureMockRecovery(handler: () => Promise<void>) {
  restart = handler;
  lastReadyAt = Date.now();
}

export function recoverMockTransport() {
  if (!restart) return Promise.resolve(false);
  if (!pending) {
    pending = Promise.resolve()
      .then(restart)
      .then(() => {
        lastReadyAt = Date.now();
      })
      .finally(() => {
        pending = undefined;
      });
  }
  return pending.then(() => true);
}

async function probeMockTransport() {
  try {
    // Read-only, demo-only handshake. It never changes cart/session/order data.
    const response = await fetch("/api/_mock-health", {
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    });
    return (
      response.ok &&
      response.headers.get("content-type")?.includes("application/json") &&
      (await response.json()).transport === "jungle-msw"
    );
  } catch {
    return false;
  }
}

async function verifyMockTransport() {
  if (await probeMockTransport()) return;
  await recoverMockTransport();
  if (!(await probeMockTransport()))
    throw new Error(
      "Não foi possível recuperar a conexão. Tente novamente em instantes.",
    );
}

export async function waitForMockTransport(verifyBeforeWrite = false) {
  if (pending) await pending;
  else if (restart && Date.now() - lastReadyAt >= IDLE_THRESHOLD)
    await recoverMockTransport();
  if (restart && verifyBeforeWrite) {
    // Concurrent writes share one check. A stopped worker is detected even
    // during active browsing, without relying on the thirty-second idle gate.
    verification ??= verifyMockTransport().finally(() => {
      verification = undefined;
    });
    await verification;
  }
  lastReadyAt = Date.now();
}
