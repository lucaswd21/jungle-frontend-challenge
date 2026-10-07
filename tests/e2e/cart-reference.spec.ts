import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { add, ready } from "./helpers";

test("reference cart quantity buttons, promotion, removal and accessibility", async ({
  page,
}) => {
  await add(page);
  await ready(page, "/cart");
  const deleteIcon = page.locator(".cart-remove img");
  await expect(deleteIcon).toHaveAttribute("src", "/assets/kurio/delete.png");
  await expect(deleteIcon).toBeVisible();
  await expect
    .poll(() =>
      deleteIcon.evaluate((image) => (image as HTMLImageElement).naturalWidth),
    )
    .toBe(18);
  const iconBounds = await deleteIcon.boundingBox();
  expect(iconBounds?.width).toBe(18);
  expect(iconBounds?.height).toBe(20);
  await expect(
    page.getByRole("heading", { name: "Resumo da carteira" }),
  ).toBeVisible();
  await expect(
    page.locator(".cart-summary").getByLabel("Código promocional"),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Aumentar quantidade de Emerald Ape #042",
      exact: true,
    })
    .click();
  await expect(page.getByLabel("Quantity for Emerald Ape #042")).toHaveValue(
    "2",
  );
  await expect(page.getByTestId("total")).toHaveText("2.396 ETH");
  await page
    .getByRole("button", {
      name: "Diminuir quantidade de Emerald Ape #042",
      exact: true,
    })
    .click();
  await expect(page.getByLabel("Quantity for Emerald Ape #042")).toHaveValue(
    "1",
  );
  await expect(page.getByTestId("total")).toHaveText("1.206 ETH");
  const input = await page.getByLabel("Código promocional").boundingBox();
  const apply = await page
    .getByRole("button", { name: "Aplicar", exact: true })
    .boundingBox();
  expect(input?.y).toBe(apply?.y);
  expect(input?.height).toBe(apply?.height);
  if (page.viewportSize()!.width < 768) {
    expect(input!.x + input!.width).toBeCloseTo(apply!.x, 1);
    await expect(
      page.getByRole("button", { name: "Aplicar", exact: true }),
    ).toHaveCSS("color", "rgb(255, 255, 255)");
  }
  if ((page.viewportSize()?.width ?? 0) >= 768) {
    const collection = page.getByRole("region", {
      name: "Colecionadores também viram",
    });
    const firstCards = await collection.locator("h3").allTextContents();
    const secondPage = collection.getByRole("button", {
      name: "Página 2 da coleção",
    });
    await secondPage.click();
    await expect(secondPage).toHaveAttribute("aria-current", "true");
    expect(await collection.locator("h3").allTextContents()).not.toEqual(
      firstCards,
    );
    await collection
      .getByRole("button", { name: "Página 3 da coleção" })
      .click();
    await collection
      .getByRole("button", { name: "Página 1 da coleção" })
      .focus();
    await page.keyboard.press("Enter");
    expect(await collection.locator("h3").allTextContents()).toEqual(
      firstCards,
    );
  }
  await page.getByLabel("Código promocional").fill("JUNGLE10");
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Remover cupom" }),
  ).toBeVisible();
  const result = await new AxeBuilder({ page }).include("#main").analyze();
  expect(result.violations).toEqual([]);
  await page
    .getByRole("button", { name: "Remove Emerald Ape #042", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Seu carrinho está vazio" }),
  ).toBeVisible();
});
