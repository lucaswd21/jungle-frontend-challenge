import { test, expect } from "@playwright/test";
import { add, buy, checkout, demo, login, openFilters, ready } from "./helpers";
test("pending order resumes after Socket.IO interruption and refresh", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-01-15T12:00:00Z") });
  await login(page);
  await add(page);
  await buy(page);
  const id = await page.getByTestId("order-id").innerText();
  await demo(page, "Interrupt socket", true);
  await page.reload();
  await expect(page.getByTestId("order-id")).toHaveText(id);
  await page.clock.fastForward(5000);
  await expect(
    page.getByRole("heading", { name: "Pedido confirmado" }),
  ).toBeVisible();
  // The confirmed receipt deliberately has no demo controls in its design.
  await ready(page);
  await demo(page, "Send older event", true);
  await ready(page, `/orders/${id}`);
  await expect(
    page.getByRole("heading", { name: "Pedido confirmado" }),
  ).toBeVisible();
});
test("server rejects outdated quote and requires a second review", async ({
  page,
}) => {
  await login(page);
  await add(page);
  await demo(page, "price-change");
  await checkout(page);
  await page.getByRole("button", { name: "Confirmar compra simulada" }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Preço ou disponibilidade alterados" }),
  ).toBeVisible();
  await expect(page.getByTestId("total")).toHaveText("1.256 ETH");
  await page.getByRole("button", { name: "Confirmar compra" }).click();
  await page.getByRole("button", { name: "Confirmar compra simulada" }).click();
  await expect(
    page.getByRole("heading", { name: "Pedido confirmado" }),
  ).toBeVisible();
});
test("wallet connection decline and disconnect block review", async ({
  page,
}) => {
  await login(page);
  await add(page);
  await ready(page, "/checkout");
  if (page.viewportSize()!.width < 768)
    await page
      .getByRole("button", { name: "Editar dados do colecionador" })
      .first()
      .click();
  await page.getByLabel("Configurar carteira manualmente").click();
  await page.getByLabel("Resposta da conexão simulada").selectOption("decline");
  await page
    .getByRole("button", { name: "Conectar carteira", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Conexão da carteira recusada" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirmar compra" }),
  ).toBeDisabled();
  await page.getByLabel("Resposta da conexão simulada").selectOption("approve");
  await page
    .getByRole("button", { name: "Conectar carteira", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Confirmar compra" }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Desconectar carteira", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Confirmar compra" }),
  ).toBeDisabled();
});
test("network failure recovers; variable latency cannot replace newer search", async ({
  page,
}) => {
  await ready(page);
  await demo(page, "offline");
  await expect(
    page.getByRole("button", { name: "Tentar novamente" }),
  ).toBeVisible();
  await demo(page, "variable");
  await openFilters(page);
  await page.getByLabel("Buscar NFTs").fill("Sage");
  await page.getByLabel("Buscar NFTs").fill("Emerald");
  await expect(
    page.getByRole("heading", { name: "Emerald Ape #042", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Sage Nomad #009", exact: true }),
  ).not.toBeVisible();
  await expect(page.getByText("1 artworks", { exact: true })).toBeVisible();
});
