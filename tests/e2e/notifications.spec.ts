import { test, expect } from "@playwright/test";
import { ready } from "./helpers";

test("notifications expire, reset on repeated actions and remain dismissible", async ({
  page,
}) => {
  await ready(page, "/nfts/nft-1");
  const buy = page.getByRole("button", { name: "Comprar NFT", exact: true });
  await expect(buy).toBeEnabled();
  await page.clock.install();
  await buy.click();
  const notice = page.getByRole("status").filter({ hasText: "NFT adicionado" });
  await expect(notice).toBeVisible();
  await page.clock.fastForward(4000);
  await expect(notice).toBeVisible();
  await buy.click();
  await expect(buy).toBeEnabled();
  await page.clock.fastForward(2000);
  await expect(notice).toBeVisible();
  await page.clock.fastForward(4000);
  await expect(notice).toHaveCount(0);
  await buy.click();
  await expect(notice).toBeVisible();
  await page.getByRole("button", { name: "Fechar notificação" }).click();
  await expect(notice).toHaveCount(0);
});
