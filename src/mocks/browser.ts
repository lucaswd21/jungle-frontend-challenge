import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";
import { socketHandler } from "./socket";
import { initialize } from "./database";
import {
  configureMockRecovery,
  recoverMockTransport,
} from "../api/mockRecovery";
export async function startMocks() {
  await initialize();
  const worker = setupWorker(...handlers, socketHandler);
  const options = {
    quiet: true,
    onUnhandledRequest: ((request, print) => {
      if (new URL(request.url).pathname.startsWith("/api/")) print.error();
    }) satisfies NonNullable<
      Parameters<typeof worker.start>[0]
    >["onUnhandledRequest"],
  };
  await worker.start(options);
  configureMockRecovery(async () => {
    // start() alone is a no-op when MSW still thinks it is enabled.
    // Reactivate its channel without reinitializing the database or UI.
    await worker.stop();
    await worker.start(options);
  });
  let wasHidden = false;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") wasHidden = true;
    else if (wasHidden) {
      wasHidden = false;
      // Request interceptors await the same promise before any API traffic.
      void recoverMockTransport().catch(() => {
        /* Request/retry reports failures. */
      });
    }
  });
}
