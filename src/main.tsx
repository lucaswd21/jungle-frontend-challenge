import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/roboto-mono/latin-400.css";
import "@fontsource/roboto-mono/latin-500.css";
import "@fontsource/roboto-mono/latin-700.css";
import "./style.css";
async function bootstrap() {
  // Download UI and network mocks concurrently; render only after interception is ready.
  const application = import("./app/App");
  if (import.meta.env.VITE_ENABLE_MOCKS !== "false") {
    const { startMocks } = await import("./mocks/browser");
    await startMocks();
  }
  // The realtime hook imports socket.io-client after mount, when interception is ready.
  const { App } = await application;
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
void bootstrap().catch((error) => {
  console.error(error);
  const root = document.getElementById("root")!;
  root.textContent =
    "Unable to start the demo. Reload this page or verify that Service Workers are supported.";
});
