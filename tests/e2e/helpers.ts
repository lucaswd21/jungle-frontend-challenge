import { expect, type Page } from "@playwright/test";
export async function ready(page: Page, path = "/") {
  await page.goto(path);
  await expect(page.locator("#main")).toBeAttached();
}
export async function demo(
  page: Page,
  value: string,
  event = false,
  refresh = true,
) {
  const kinds: Record<string, string> = {
    "Change NFT price": "price",
    "Exhaust edition": "stock",
    "Duplicate event": "duplicate",
    "Send older event": "old",
    "Interrupt socket": "disconnect",
    "Resolve pending orders": "settle",
    "Expire session": "expire",
  };
  await page.evaluate(
    async ({ value, event, kinds }) => {
      const response = await fetch(
        event ? "/api/demo/event" : "/api/demo/scenario",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            event ? { kind: kinds[value] } : { scenario: value },
          ),
        },
      );
      if (!response.ok)
        throw new Error(`Unable to set demo fixture: ${response.status}`);
    },
    { value, event, kinds },
  );
  // Scenario changes affect subsequent REST reads; refresh their cached UI.
  // Events stay on the current screen to exercise the real Socket.IO listener.
  if (refresh && (!event || value === "Expire session")) await page.reload();
}
export async function login(
  page: Page,
  email = "alex@example.test",
  password = "Jungle123!",
) {
  await ready(page, "/login");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
export async function add(page: Page, quantity = 1) {
  await ready(page, "/nfts/nft-1");
  await expect(
    page.getByRole("heading", { name: "Emerald Ape #042", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Quantidade", { exact: true }).fill(String(quantity));
  await page.getByRole("button", { name: "Comprar NFT", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "NFT adicionado" }),
  ).toBeVisible();
}
export async function checkout(page: Page) {
  await ready(page, "/checkout");
  if (page.viewportSize()!.width < 768) {
    await page.getByRole("radio", { name: "MetaMask", exact: true }).check();
  } else {
    await page.getByLabel("Configurar carteira manualmente").click();
    await page
      .getByRole("button", { name: "Conectar carteira", exact: true })
      .click();
    await expect(
      page.getByRole("status").filter({ hasText: "Conectada (simulação)" }),
    ).toBeVisible();
  }
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
}
export async function buy(page: Page) {
  await checkout(page);
  await page.getByRole("button", { name: "Confirmar compra simulada" }).click();
  await expect(page).toHaveURL(/\/orders\/order-/);
}

export async function openFilters(page: Page) {
  await expect(page.locator(".catalog-filters")).toBeAttached();
  const trigger = page.getByRole("button", {
    name: "Filtrar NFTs",
    exact: true,
  });
  if (
    (await trigger.isVisible()) &&
    (await trigger.getAttribute("aria-expanded")) === "false"
  ) {
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByLabel("Coleção", { exact: true })).toBeVisible();
    return;
  }
  const summary = page.locator(".catalog-filters > summary");
  if (
    (await summary.isVisible()) &&
    !(await page
      .locator(".catalog-filters")
      .evaluate((node) => (node as HTMLDetailsElement).open))
  )
    await summary.click();
}
