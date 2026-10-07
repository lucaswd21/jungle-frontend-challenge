import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { add, demo, ready } from "./helpers";

test("mobile cart count survives navigation and compact controls do not overlap", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "mobile", "Mobile cart regression");
  await add(page, 2);
  await ready(page);
  await expect(page.getByTestId("mobile-cart-count")).toHaveText("2");
  await page.getByRole("link", { name: "Carrinho (2)", exact: true }).click();
  await expect(page.getByLabel("Quantity for Emerald Ape #042")).toHaveValue(
    "2",
  );
  for (const id of ["nft-2", "nft-3", "nft-4"]) {
    await ready(page, `/nfts/${id}`);
    await page
      .getByRole("button", { name: "Comprar NFT", exact: true })
      .click();
    await expect(
      page.getByRole("status").filter({ hasText: "NFT adicionado" }),
    ).toBeVisible();
  }
  await ready(page, "/cart");
  await expect(page.locator(".cart-line")).toHaveCount(4);
  for (const width of [320, 390, 414]) {
    await page.setViewportSize({ width, height: 844 });
    const plus = await page
      .getByRole("button", {
        name: "Aumentar quantidade de Emerald Ape #042",
        exact: true,
      })
      .boundingBox();
    const remove = await page
      .getByRole("button", { name: "Remove Emerald Ape #042", exact: true })
      .boundingBox();
    expect(plus!.x + plus!.width).toBeLessThanOrEqual(remove!.x);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.screenshot({
    path: "reports/mobile-cart-four-items.png",
    fullPage: true,
  });
  const accessibility = await new AxeBuilder({ page })
    .include("#main")
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page
    .getByRole("button", { name: "Remove Emerald Ape #042", exact: true })
    .click();
  await expect(page.locator(".cart-line")).toHaveCount(3);
  await ready(page);
  await expect(
    page.getByRole("link", { name: "Carrinho (3)", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("mobile-cart-count")).toHaveText("3");
});

test("cart mutation failure stays readable and preserves quantity", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "mobile", "Mobile error regression");
  await add(page);
  await ready(page, "/cart");
  await expect(page.getByLabel("Quantity for Emerald Ape #042")).toHaveValue(
    "1",
  );
  // Fail the next mutation while preserving the already-loaded cart UI.
  await demo(page, "server-error", false, false);
  await page.clock.install();
  await page
    .getByRole("button", {
      name: "Aumentar quantidade de Emerald Ape #042",
      exact: true,
    })
    .click();
  const notice = page
    .getByRole("status")
    .filter({ hasText: "Ação não concluída" });
  await expect(notice).toBeVisible();
  await page.clock.fastForward(6000);
  await expect(notice).toBeVisible();
  await page.clock.fastForward(3000);
  await expect(notice).toHaveCount(0);
  await expect(page.getByLabel("Quantity for Emerald Ape #042")).toHaveValue(
    "1",
  );
});
