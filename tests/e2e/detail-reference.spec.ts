import { test, expect } from "@playwright/test";
import { ready } from "./helpers";
test("desktop reference layout keeps purchase controls and illustrative reviews functional", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "desktop", "Desktop reference composition");
  await ready(page, "/nfts/nft-1");
  await expect(
    page.getByRole("heading", { name: "Emerald Ape #042", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".edition-metadata")).toBeVisible();
  const gallery = await page.locator(".gallery-main").boundingBox();
  expect(gallery!.width).toBeLessThanOrEqual(444);
  await page
    .getByRole("button", { name: "Aumentar quantidade", exact: true })
    .click();
  await expect(page.getByLabel("Quantidade", { exact: true })).toHaveValue("2");
  await page
    .getByRole("button", { name: /Ver avaliações ilustrativas/ })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "não possui avaliações reais" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Detalhes do NFT", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Detalhes do NFT", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Comprar NFT", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "NFT adicionado" }),
  ).toBeVisible();
});

test("mobile detail keeps reviews, edition selection and purchase accessible", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "mobile", "Mobile detail interaction");
  await ready(page, "/nfts/nft-1");
  await expect(
    page.getByRole("heading", { name: "Emerald Ape #042", exact: true }),
  ).toBeVisible();
  const back = await page
    .getByRole("link", { name: "Voltar ao mercado", exact: true })
    .boundingBox();
  const icon = await page.locator(".detail-back svg").boundingBox();
  expect(
    Math.abs(back!.x + back!.width / 2 - icon!.x - icon!.width / 2),
  ).toBeLessThan(1);
  expect(
    Math.abs(back!.y + back!.height / 2 - icon!.y - icon!.height / 2),
  ).toBeLessThan(1);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const panel = page.locator(".detail-transaction");
    await expect(panel).not.toHaveCSS("box-shadow", "none");
    const before = await panel.boundingBox();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);
    const after = await panel.boundingBox();
    expect(Math.abs(before!.y - after!.y)).toBeLessThan(1);
    expect(after!.y + after!.height).toBe(844);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const lastParagraph = page.locator(".nft-description p").last();
    await lastParagraph.scrollIntoViewIfNeeded();
    const paragraph = await lastParagraph.boundingBox();
    expect(paragraph!.y + paragraph!.height).toBeLessThanOrEqual(after!.y);
  }
  await page
    .getByRole("button", { name: /Ver avaliações ilustrativas/ })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "não possui avaliações reais" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Detalhes do NFT", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Aumentar quantidade", exact: true })
    .click();
  await expect(page.getByLabel("Quantidade", { exact: true })).toHaveValue("2");
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations).toEqual([]);
  await page.getByRole("button", { name: "Comprar NFT", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "NFT adicionado" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Ver carrinho", exact: true }).click();
  await expect(page).toHaveURL(/\/cart/);
  await expect(
    page.getByLabel("Quantity for Emerald Ape #042", { exact: true }),
  ).toHaveValue("2");
});
