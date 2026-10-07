import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { demo, login, ready } from "./helpers";

test("mobile catalog favorites persist, recover from failure and remain accessible", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile catalog actions");
  await login(page);
  await ready(page);
  const card = page.locator(".nft-card").first();
  const heart = card.getByRole("button", { name: /Adicionar aos favoritos/ });
  await expect(heart).toHaveCSS("opacity", "0");
  await card.getByRole("link").focus();
  await expect(heart).toHaveCSS("opacity", "1");
  await heart.click();
  await expect(
    card.getByRole("button", { name: /Remover dos favoritos/ }),
  ).toBeEnabled();
  await page.reload();
  await expect(
    card.getByRole("button", { name: /Remover dos favoritos/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await demo(page, "favorite-failure");
  await card.getByRole("button", { name: /Remover dos favoritos/ }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "seleção anterior foi restaurada" }),
  ).toBeVisible();
  await expect(
    card.getByRole("button", { name: /Remover dos favoritos/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await demo(page, "standard");
  await card.getByRole("button", { name: /Remover dos favoritos/ }).click();
  await expect(heart).toBeEnabled();
  await expect(page.locator(".rare-badge").first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("mobile reference geometry at 390 and 414 pixels", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile reference geometry");
  for (const width of [390, 414]) {
    await page.setViewportSize({ width, height: 896 });
    await ready(page);
    await expect(page.locator(".nft-card").first()).toBeVisible();
    const hero = await page.locator(".market-hero").boundingBox();
    expect(hero?.height).toBe(190);
    await expect(page.locator(".mobile-center-action img")).toHaveAttribute(
      "src",
      "/assets/kurio/mobile/explore.png",
    );
    await page.screenshot({ path: `reports/mobile-catalog-${width}.png` });
  }
});

test("mobile catalog tabs stay aligned when the selection changes", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile catalog navigation");
  await ready(page);
  const tabs = page
    .getByRole("group", { name: "Seleção do catálogo" })
    .getByRole("button");
  for (const index of [1, 2, 0]) {
    await tabs.nth(index).click();
    await expect(tabs.nth(index)).toHaveAttribute("aria-pressed", "true");
    const tops = await tabs.evaluateAll((nodes) =>
      nodes.map((node) => {
        const text = document.createRange();
        text.selectNodeContents(node);
        return text.getBoundingClientRect().top;
      }),
    );
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(1);
    const heights = await tabs.evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().height),
    );
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(1);
  }
  await page.locator(".mobile-center-action").click();
  await expect(page).toHaveURL(/#catalog$/);
  await expect(page.locator("#catalog")).toBeInViewport();
});

test("mobile navigation stays at viewport bottom without horizontal overflow", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile viewport edge");
  for (const width of [320, 360, 368, 390, 414]) {
    await page.setViewportSize({ width, height: 844 });
    await ready(page);
    await expect(page.locator(".nft-card").first()).toBeVisible();
    for (const bottom of [false, true]) {
      await page.evaluate(
        (bottom) =>
          scrollTo({
            top: bottom ? document.body.scrollHeight : 0,
            behavior: "instant",
          }),
        bottom,
      );
      const geometry = await page
        .locator(".mobile-bottom-nav")
        .evaluate((node) => ({
          bottom: node.getBoundingClientRect().bottom,
          viewport: innerHeight,
          overflow:
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        }));
      expect(
        geometry.overflow,
        `horizontal overflow at ${width}px`,
      ).toBeLessThanOrEqual(0);
      expect(
        Math.abs(geometry.bottom - geometry.viewport),
        `bottom gap at ${width}px`,
      ).toBeLessThanOrEqual(1);
    }
  }
});
