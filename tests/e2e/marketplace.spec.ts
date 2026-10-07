import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { add, buy, checkout, demo, login, openFilters, ready } from "./helpers";
// Each test gets an isolated browser context: no shared sessions, IndexedDB or localStorage.
test("catalog search, combined filters, sorting, pagination and browser history", async ({
  page,
}) => {
  await ready(page);
  await expect(
    page.getByRole("heading", { name: "Emerald Ape #042", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await openFilters(page);
  await page.getByLabel("Coleção", { exact: true }).selectOption("Art");
  await expect(page).toHaveURL(/category=Art/);
  await expect(page).not.toHaveURL(/page=2/);
  await page.getByLabel("Ordenar por").selectOption("price-desc");
  await page.getByLabel("Buscar NFTs").fill("Emerald");
  await expect(page.getByText("1 artworks", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Buscar NFTs")).toHaveValue("Emerald");
  await page.goBack();
  await expect(page.getByLabel("Buscar NFTs")).not.toHaveValue("Emerald");
});
test("direct detail, missing NFT and unavailable edition", async ({ page }) => {
  await ready(page, "/nfts/nft-3");
  await expect(
    page.getByRole("heading", { name: "Neon Vessel #552" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /esgotada/ })).toBeDisabled();
  const secondPreview = page.getByRole("button", {
    name: "Ver imagem 2 da obra",
  });
  if (await secondPreview.isVisible()) {
    await secondPreview.click();
    await expect(
      page.getByAltText("Neon Vessel #552 por Sam Nova"),
    ).toHaveAttribute("src", "/assets/kurio/sage.webp");
    await page
      .getByRole("button", { name: "Ampliar Neon Vessel #552" })
      .click();
  } else {
    await page
      .getByRole("button", { name: "Ampliar Neon Vessel #552" })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Ver imagem 2 da obra" })
      .click();
    await expect(
      page.getByAltText("Neon Vessel #552, imagem ampliada"),
    ).toHaveAttribute("src", "/assets/kurio/sage.webp");
  }
  const viewer = page.getByRole("dialog");
  await expect(viewer).toBeVisible();
  await expect(viewer).toContainText("Visualização ampliada da obra.");
  const thumbnails = viewer.locator(".gallery-thumbnails button");
  const boxes = await thumbnails.evaluateAll((buttons) =>
    buttons.map((button) => {
      const { x, y } = button.getBoundingClientRect();
      return { x, y };
    }),
  );
  expect(boxes.length).toBeGreaterThan(1);
  expect(boxes[1].x).toBeGreaterThan(boxes[0].x);
  expect(Math.abs(boxes[1].y - boxes[0].y)).toBeLessThan(1);
  await viewer
    .getByRole("button", { name: "Ver imagem 1 da obra", exact: true })
    .click();
  await expect(
    viewer.getByAltText("Neon Vessel #552, imagem ampliada"),
  ).toHaveAttribute("src", "/assets/kurio/vessel.webp");
  expect(
    (await new AxeBuilder({ page }).include('[role="dialog"]').analyze())
      .violations,
  ).toEqual([]);
  await viewer.screenshot({
    path: `reports/gallery-${page.viewportSize()!.width}.png`,
  });
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Ampliar Neon Vessel #552" }),
  ).toBeFocused();
  await ready(page, "/nfts/missing");
  await expect(page.getByText("Este NFT não foi encontrado.")).toBeVisible();
});
test("visitor cart survives refresh and merges after login", async ({
  page,
}) => {
  await add(page, 2);
  await ready(page, "/cart");
  await expect(page.getByTestId("total")).toHaveText("2.396 ETH");
  await page.reload();
  await expect(page.getByLabel("Quantity for Emerald Ape #042")).toHaveValue(
    "2",
  );
  await login(page);
  await ready(page, "/cart");
  await expect(page.getByLabel("Quantity for Emerald Ape #042")).toHaveValue(
    "2",
  );
  await page.getByLabel("Código promocional").fill("BAD");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page.getByRole("alert")).toContainText("inválido");
  await page.getByLabel("Código promocional").fill("JUNGLE10");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page.getByTestId("total")).toHaveText("2.158 ETH");
  await page.getByRole("button", { name: "Remover cupom" }).click();
  await expect(page.getByTestId("total")).toHaveText("2.396 ETH");
  await page.getByLabel("Quantity for Emerald Ape #042").fill("1");
  await expect(page.getByTestId("total")).toHaveText("1.206 ETH");
  await page
    .getByRole("button", { name: "Remove Emerald Ape #042", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Seu carrinho está vazio" }),
  ).toBeVisible();
});
test("complete purchase, duplicate click guard and immutable receipt", async ({
  page,
}) => {
  await login(page);
  await add(page);
  await checkout(page);
  const confirm = page.getByRole("button", {
    name: "Confirmar compra simulada",
  });
  const orderIds: string[] = [];
  page.on("response", async (response) => {
    if (
      response.url().endsWith("/api/orders") &&
      response.request().method() === "POST" &&
      response.ok()
    )
      orderIds.push((await response.json()).id);
  });
  await confirm.evaluate((button) => {
    button.click();
    button.click();
  });
  await expect(page).toHaveURL(/\/orders\/order-/);
  await expect(
    page.getByRole("heading", { name: "Pedido confirmado" }),
  ).toBeVisible();
  const id = await page.getByTestId("order-id").innerText();
  expect(orderIds.length).toBeGreaterThan(0);
  expect(new Set(orderIds)).toEqual(new Set([id]));
  await expect(page.getByTestId("total")).toHaveText("1.206 ETH");
  await demo(page, "Change NFT price", true);
  await page.reload();
  await expect(page.getByTestId("order-id")).toHaveText(id);
  await expect(page.getByTestId("total")).toHaveText("1.206 ETH");
  await ready(page, "/cart");
  await expect(
    page.getByRole("heading", { name: "Seu carrinho está vazio" }),
  ).toBeVisible();
});
test("declined payment preserves the cart", async ({ page }) => {
  await login(page);
  await add(page);
  await demo(page, "declined");
  await buy(page);
  await expect(
    page.getByRole("heading", { name: "Pagamento recusado", exact: true }),
  ).toBeVisible();
  await ready(page, "/cart");
  await expect(page.getByLabel("Quantity for Emerald Ape #042")).toHaveValue(
    "1",
  );
});
test("timeout after creation recovers the same confirmed order", async ({
  page,
}) => {
  await login(page);
  await add(page);
  await demo(page, "timeout");
  await buy(page);
  await expect(
    page.getByRole("heading", { name: "Pedido confirmado" }),
  ).toBeVisible();
  const id = await page.getByTestId("order-id").innerText();
  await page.reload();
  await expect(page.getByTestId("order-id")).toHaveText(id);
});
test("favorite optimistic failure rolls back and then succeeds", async ({
  page,
}) => {
  await login(page);
  await ready(page, "/nfts/nft-1");
  await demo(page, "favorite-failure");
  await page.getByRole("button", { name: "Adicionar aos favoritos" }).click();
  await expect(
    page.getByRole("button", { name: "Adicionar aos favoritos" }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "seleção anterior foi restaurada" }),
  ).toBeVisible();
  await demo(page, "standard");
  await page.getByRole("button", { name: "Adicionar aos favoritos" }).click();
  await expect(
    page.getByRole("button", { name: "Remover dos favoritos" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Remover dos favoritos" }),
  ).toBeEnabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Remover dos favoritos" }),
  ).toBeVisible();
});
test("Socket.IO price update invalidates a review; duplicate and old events do not regress", async ({
  page,
}) => {
  await login(page);
  await add(page);
  await checkout(page);
  await page.getByRole("button", { name: "Fechar diálogo" }).click();
  await demo(page, "Change NFT price", true);
  await expect(page.getByTestId("total")).toHaveText("1.256 ETH");
  await demo(page, "Duplicate event", true);
  await demo(page, "Send older event", true);
  await expect(page.getByTestId("total")).toHaveText("1.256 ETH");
  await page.getByRole("button", { name: "Confirmar compra" }).click();
  await page.getByRole("button", { name: "Confirmar compra simulada" }).click();
  await expect(
    page.getByRole("heading", { name: "Pedido confirmado" }),
  ).toBeVisible();
});
test("stock exhaustion through Socket.IO prevents checkout", async ({
  page,
}) => {
  await login(page);
  await add(page);
  await ready(page, "/checkout");
  await demo(page, "Exhaust edition", true);
  await expect(page.getByRole("alert")).toContainText("only 0 available");
  await expect(
    page.getByRole("button", { name: "Confirmar compra" }),
  ).toBeDisabled();
});
test("slow skeletons, empty state and recoverable HTTP error", async ({
  page,
}) => {
  await ready(page);
  await demo(page, "slow");
  await ready(page, "/nfts/nft-2");
  await expect(page.getByTestId("skeleton").first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Sage Nomad #009" }),
  ).toBeVisible();
  await demo(page, "empty");
  await ready(page);
  await expect(
    page.getByRole("heading", { name: "Nenhum NFT encontrado" }),
  ).toBeVisible();
  await demo(page, "server-error");
  await expect(
    page.getByRole("button", { name: "Tentar novamente" }),
  ).toBeVisible();
  await demo(page, "standard");
  await expect(
    page.getByRole("heading", { name: "Emerald Ape #042", exact: true }),
  ).toBeVisible();
});
