import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { add, login, ready } from "./helpers";

test("mobile wallet payment fits narrow screens and preserves collector editing", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile wallet layout");
  await login(page);
  await add(page);
  await ready(page, "/checkout");
  await expect(
    page.getByRole("button", { name: "Confirmar compra", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("heading", { name: "Carteira conectada", exact: true }),
  ).toBeVisible();
  await page.getByRole("radio", { name: "WalletConnect", exact: true }).check();
  const confirm = page.getByRole("button", {
    name: "Confirmar compra",
    exact: true,
  });
  await expect(confirm).toBeEnabled();
  await expect(
    page.getByRole("heading", { name: "Carteira conectada" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cenários de demonstração" }),
  ).toHaveCount(0);
  for (const width of [320, 390, 414]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    const title = await page
      .getByRole("heading", { name: "Pagamento com carteira" })
      .boundingBox();
    expect(Math.abs(title!.x + title!.width / 2 - width / 2)).toBeLessThan(1);
    const total = await page.getByTestId("total").boundingBox();
    const button = await confirm.boundingBox();
    expect(total!.y + total!.height).toBeLessThan(button!.y);
    expect(button!.y + button!.height).toBeLessThanOrEqual(844);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Fechar notificação" }).click();
  await page.screenshot({
    path: "reports/mobile-payment-connected.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Editar dados do colecionador" })
    .first()
    .click();
  await page
    .getByLabel("Nome de exibição", { exact: true })
    .fill("Colecionador mobile");
  await page
    .getByRole("button", { name: "Editar dados do colecionador" })
    .first()
    .click();
  await confirm.click();
  await expect(
    page.getByRole("dialog", { name: "Revise seu pedido" }),
  ).toContainText("Colecionador mobile");
});
