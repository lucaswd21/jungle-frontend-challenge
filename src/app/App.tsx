import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { Providers } from "./providers";
export function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}
