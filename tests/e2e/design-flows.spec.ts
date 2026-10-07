import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { add, buy, login, openFilters, ready } from "./helpers";

test("price and network filters survive refresh; original assets load", async ({
  page,
}) => {
  await ready(page);
  await openFilters(page);
  await page.getByLabel("Buscar NFTs").fill("Golden Signal");
  await page.getByRole("button", { name: "Solana" }).click();
  await page.getByLabel("Preço máximo").fill("0.5");
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(page).toHaveURL(/max=0.5/);
  await expect(
    page.getByRole("heading", { name: "Golden Signal #160", exact: true }),
  ).toBeVisible();
  await page.reload();
  await openFilters(page);
  await expect(page.getByLabel("Buscar NFTs")).toHaveValue("Golden Signal");
  await expect(page.getByRole("button", { name: "Solana" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect
    .poll(() =>
      page
        .locator(".nft-grid img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await page.getByLabel("Preço máximo").fill("0.1");
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Nenhum NFT encontrado" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await expect(
    page.getByRole("heading", { name: "Emerald Ape #042", exact: true }),
  ).toBeVisible();
  await expect(page).not.toHaveURL(/network=|max=|min=/);
  await expect(page.getByLabel("Preço máximo")).toHaveValue("12.3");
});

test("authentication modal is accessible and closes to catalog", async ({
  page,
}) => {
  await ready(page, "/login");
  await expect(page.getByRole("dialog")).toBeVisible();
  if (page.viewportSize()!.width >= 768)
    await expect(page.getByText("Novo na Kurio?")).toHaveCount(0);
  else
    await expect(
      page.getByRole("link", { name: "Crie uma conta" }),
    ).toBeVisible();
  await expect(page.getByText("Conta de demonstração")).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveJSProperty(
    "scrollWidth",
    await page.getByRole("dialog").evaluate((dialog) => dialog.clientWidth),
  );
  const password = page.getByLabel("Senha", { exact: true });
  await expect(password).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Mostrar senha" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Ocultar senha" }).click();
  await expect(password).toHaveAttribute("type", "password");
  await page.evaluate(() => document.fonts.ready);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await expect(page).toHaveScreenshot("login.png", { animations: "disabled" });
  await page.keyboard.press("Escape");
  await expect(page).not.toHaveURL(/login/);
  await ready(page, "/signup");
  await expect(page.getByLabel("Confirmar senha")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveJSProperty(
    "scrollWidth",
    await page.getByRole("dialog").evaluate((dialog) => dialog.clientWidth),
  );
  await page.getByRole("button", { name: "Mostrar senha" }).click();
  await expect(page.getByLabel("Senha", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page.getByRole("button", { name: "Ocultar senha" }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await expect(page).toHaveScreenshot("signup.png", { animations: "disabled" });
});

test("mobile favorites opens a saved NFT and dismisses its dialog", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "mobile",
    "The bottom navigation is mobile-only",
  );
  await login(page);
  await ready(page, "/nfts/nft-1");
  await page.getByRole("button", { name: "Adicionar aos favoritos" }).click();
  await expect(
    page.getByRole("button", { name: "Remover dos favoritos" }),
  ).toBeEnabled();
  await ready(page);
  await page.getByRole("button", { name: "Favoritos", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Favoritos", exact: true })
    .getByRole("link", { name: "Ver NFT nft-1", exact: true })
    .click();
  await expect(page).toHaveURL(/nfts\/nft-1/);
  await expect(
    page.getByRole("dialog", { name: "Favoritos", exact: true }),
  ).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Emerald Ape #042", exact: true }),
  ).toBeVisible();
});

test("confirmed receipt matches the thank-you design and preserves order on refresh", async ({
  page,
}) => {
  // Freeze the receipt date so a midnight rollover does not change its visual baseline.
  await page.clock.install({ time: new Date("2026-10-06T12:00:00Z") });
  await login(page);
  await add(page);
  const failures: string[] = [];
  page.on("response", (response) => {
    if (response.url().includes("/api/") && response.status() >= 400)
      failures.push(`${response.status()} ${response.url()}`);
  });
  await buy(page);
  await page.clock.fastForward(5000);
  await expect(
    page.getByRole("heading", { name: "Pedido confirmado", exact: true }),
  ).toBeVisible();
  const receipt = page.locator(".thank-you-card");
  await expect(page.locator(".site-header")).toHaveCount(0);
  await expect(page.locator(".footer-community")).toHaveCount(0);
  await expect(page.locator(".compact-demo")).not.toBeVisible();
  await expect(receipt.getByText("Dados do recibo simulado")).toHaveCount(0);
  await expect(
    receipt.getByRole("button", { name: "Ver no Etherscan" }),
  ).toBeVisible();
  await expect(
    receipt.locator('img[src="/assets/thank-you.png"]'),
  ).toHaveJSProperty("naturalWidth", 80);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(failures).toEqual([]);
  await expect(
    page.getByText("Ação não concluída", { exact: true }),
  ).not.toBeVisible();
  await expect(receipt).toHaveScreenshot("thank-you.png", {
    animations: "disabled",
    // Allow only tiny resampling differences in the 48 px artwork thumbnail.
    maxDiffPixels: 8,
  });
  const orderUrl = page.url();
  await receipt.getByRole("button", { name: "Ver no Etherscan" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "não há transação real" }),
  ).toBeVisible();
  await expect(page).toHaveURL(orderUrl);
  const id = await page.getByTestId("order-id").innerText();
  await page.reload();
  await expect(page.getByTestId("order-id")).toHaveText(id);
  await expect(page.getByTestId("total")).toHaveText("1.206 ETH");
  await page.getByRole("link", { name: "Fechar recibo" }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/");
});

test("payment layout has accessible breadcrumb and no horizontal overflow", async ({
  page,
}) => {
  await login(page);
  await add(page);
  await ready(page, "/checkout");
  const mobile = page.viewportSize()!.width < 768;
  if (!mobile)
    await expect(
      page.getByRole("heading", { name: "Pagamento", exact: true }),
    ).toBeVisible();
  if (mobile) {
    await expect(
      page.getByRole("heading", { name: "Pagamento com carteira" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Cenários de demonstração" }),
    ).toHaveCount(0);
    await expect(page.getByTestId("total")).toBeVisible();
  } else {
    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(
      breadcrumb.getByRole("link", { name: "Início" }),
    ).toHaveAttribute("href", "/");
    await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText(
      "Pagamento",
    );
    await expect(page.getByLabel("Nome ENS", { exact: true })).toHaveCSS(
      "width",
      "78px",
    );
  }
  await expect(
    page.getByLabel("Carteira selecionada", { exact: true }),
  ).not.toBeVisible();
  await expect(
    page.getByRole("radio", { name: "MetaMask", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(page.viewportSize()!.width);
  if (!mobile) {
    const image = page.locator(".checkout-item img").first();
    await expect(image).toBeVisible();
    expect(
      await image.evaluate((node) => (node as HTMLImageElement).naturalWidth),
    ).toBeGreaterThan(0);
  }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await expect(page.locator(".checkout-page")).toHaveScreenshot(
    "payment-layout.png",
    { animations: "disabled" },
  );
  await page
    .getByRole("radio", { name: "Coinbase Wallet", exact: true })
    .check();
  await expect(
    page.getByRole("button", { name: "Confirmar compra", exact: true }),
  ).toBeEnabled();
});

test("collector fields are validated by the API and preserved in the receipt", async ({
  page,
}) => {
  await login(page);
  await add(page);
  await ready(page, "/checkout");
  if (page.viewportSize()!.width < 768)
    await page
      .getByRole("button", { name: "Editar dados do colecionador" })
      .first()
      .click();
  await page.getByLabel("Configurar carteira manualmente").click();
  await page.getByLabel("Carteira secundária (opcional)").fill("invalid");
  await page
    .getByLabel("Observação do colecionador (opcional)")
    .fill("Minha primeira coleção.");
  await page
    .getByRole("button", { name: "Conectar carteira", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Conectada (simulação)" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirmar compra simulada" }).click();
  await expect(
    page.getByText("Use um endereço 0x válido ou um nome .eth.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/checkout$/);
  await page
    .getByLabel("Carteira secundária (opcional)")
    .fill("colecionador.eth");
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirmar compra simulada" }).click();
  await expect(
    page.getByRole("heading", { name: "Pedido confirmado", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Minha primeira coleção.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Minha primeira coleção.", { exact: true }),
  ).toBeVisible();
});

test("catalog filters retain scroll and pagination returns to catalog, not hero", async ({
  page,
}) => {
  await ready(page);
  await expect(page.locator(".nft-card").first()).toBeVisible();
  await openFilters(page);
  await page
    .locator("#catalog")
    .evaluate((section) =>
      section.scrollIntoView({ block: "start", behavior: "instant" }),
    );
  const catalogY = await page.evaluate(() => window.scrollY);
  expect(catalogY).toBeGreaterThan(100);
  await page.getByLabel("Coleção", { exact: true }).selectOption("Art");
  await expect(page).toHaveURL(/category=Art/);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(catalogY - 50);
  await page.getByLabel("Coleção", { exact: true }).selectOption("");
  await page.getByRole("button", { name: "Page 2", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect
    .poll(() =>
      page
        .locator("#catalog")
        .evaluate((section) => Math.abs(section.getBoundingClientRect().top)),
    )
    .toBeLessThan(5);
  await expect(
    page.getByRole("button", { name: "Page 2", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});
