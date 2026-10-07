import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { add, checkout, login, ready } from "./helpers";
test("keyboard navigation, dialog focus and automated accessibility checks", async ({
  page,
}) => {
  await ready(page);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Pular para o conteúdo" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
  const home = await new AxeBuilder({ page }).analyze();
  expect(home.violations).toEqual([]);
  await login(page);
  await add(page);
  await checkout(page);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Confirmar compra simulada" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirmar compra" }),
  ).toBeFocused();
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations).toEqual([]);
});
test("no horizontal overflow at tablet and zoom-equivalent widths", async ({
  page,
}) => {
  for (const width of [390, 768, 1440, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await ready(page);
    await expect(
      page.getByRole("heading", { name: "Emerald Ape #042", exact: true }),
    ).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
