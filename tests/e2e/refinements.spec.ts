import { test, expect } from "@playwright/test";
import { demo, ready } from "./helpers";

test("desktop navbar follows editorial and learning sections; ordering is aligned", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop",
    "Desktop header and ordering control",
  );
  await ready(page);
  const select = page.locator(".catalog-toolbar select");
  await expect(select).toBeVisible();
  const alignment = await page
    .locator(".catalog-toolbar > .space-y-2")
    .evaluate((node) => {
      const label = node.querySelector("label")!.getBoundingClientRect();
      const select = node.querySelector("select")!.getBoundingClientRect();
      return Math.abs(
        label.top + label.height / 2 - select.top - select.height / 2,
      );
    });
  expect(alignment).toBeLessThanOrEqual(1);
  await page.getByRole("link", { name: "Criadores", exact: true }).click();
  await expect(page.locator("header nav a.selected")).toHaveText("Criadores");
  await expect(page.locator("#creators h2").first()).toHaveText(
    "Diário da Cunhagem",
  );
  await page.getByRole("link", { name: "Aprenda", exact: true }).click();
  await expect(page.locator("header nav a.selected")).toHaveText("Aprenda");
  await expect(page.locator("#learn h2").first()).toHaveText(
    "Segurança da carteira",
  );
});

test("malformed cart and HTML fallback never crash the shell and recover", async ({
  page,
}) => {
  await ready(page);
  for (const scenario of ["invalid-cart", "html-response"]) {
    await demo(page, scenario);
    await expect(
      page.getByRole("heading", { name: "SEJA DONO", exact: false }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Não foi possível abrir esta página" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("status").filter({ hasText: "Ação não concluída" }),
    ).toBeVisible();
    await ready(page, "/cart");
    await expect(
      page.getByRole("heading", {
        name: "Não foi possível carregar este conteúdo",
      }),
    ).toBeVisible();
    await demo(page, "standard");
    await expect(
      page.getByRole("heading", { name: "Seu carrinho está vazio" }),
    ).toBeVisible();
    await ready(page);
  }
});

test("catalog sections compose URL, pagination and ordering", async ({
  page,
}) => {
  await ready(page, "/?page=3");
  await page
    .getByRole("button", { name: "Novos lançamentos", exact: true })
    .click();
  await expect(page).toHaveURL(/view=new/);
  await expect(page).toHaveURL(/page=1/);
  await expect(page.locator(".nft-grid .nft-card")).toHaveCount(9);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Novos lançamentos" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Em alta", exact: true }).click();
  await expect(page).toHaveURL(/view=trending/);
  await expect(
    page.getByRole("button", { name: "Em alta", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Todos os NFTs", exact: true })
    .click();
  await expect(page).not.toHaveURL(/view=/);
});

test("desktop auth opens over existing catalog, preserves URL and restores focus", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop",
    "Mobile uses the designed standalone auth screen",
  );
  await ready(page, "/?sort=price-asc&page=2");
  const url = page.url();
  const title = await page.locator(".nft-grid h3").first().textContent();
  const trigger = page.getByRole("button", { name: "Entrar", exact: true });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(page.url()).toBe(url);
  await expect(page.locator(".nft-grid")).toHaveCount(1);
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Criar conta", exact: true })
    .click();
  await expect(page.getByLabel("Confirmar senha")).toBeVisible();
  expect(page.url()).toBe(url);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.locator(".nft-grid h3").first()).toHaveText(title!);
});
