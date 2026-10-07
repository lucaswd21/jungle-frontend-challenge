import { test, expect } from "@playwright/test";
import { add, buy, login, ready } from "./helpers";

test("fractional coupon discount renders the confirmed receipt and survives refresh", async ({
  page,
}) => {
  await login(page);
  await add(page, 3);
  await ready(page, "/cart");
  await page.getByLabel("Código promocional").fill("JUNGLE10");
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(page.getByTestId("total")).toHaveText("3.229 ETH");
  await buy(page);
  await expect(
    page.getByRole("heading", { name: "Pedido confirmado" }),
  ).toBeVisible();
  await expect(page.getByText("−0.357 ETH", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Não foi possível abrir esta página" }),
  ).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("−0.357 ETH", { exact: true })).toBeVisible();
});

test("intentional logout reaches home without a session-expired redirect", async ({
  page,
}) => {
  await login(page);
  await ready(page, "/profile");
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/");
  await expect(
    page.getByRole("status").filter({ hasText: "Você saiu da sua conta." }),
  ).toBeVisible();
  await expect(
    page.getByText("Sua sessão terminou. Entre para retomar seu progresso."),
  ).toHaveCount(0);
  if (page.viewportSize()!.width >= 768) {
    await page.getByRole("button", { name: "Fechar notificação" }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/");
    return;
  }
  await page.getByRole("link", { name: "Meu perfil", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const authURL = page.url();
  await page.getByRole("button", { name: "Fechar notificação" }).click();
  await expect(page).toHaveURL(authURL);
  await expect(page.getByRole("dialog")).toBeVisible();
});
