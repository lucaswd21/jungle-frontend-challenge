import { test, expect } from "@playwright/test";
import { add, login, ready } from "./helpers";
test("versioned visual baselines: home, detail, cart, checkout, profile and wallets", async ({
  page,
}) => {
  await ready(page);
  await expect(page).toHaveTitle("Mercado de NFTs | Kurio");
  await expect(
    page.getByRole("heading", { name: "Emerald Ape #042", exact: true }),
  ).toBeVisible();
  if ((page.viewportSize()?.width ?? 0) >= 768) {
    const community = page.locator(".footer-community");
    await expect(community.locator(".footer-social a")).toHaveCount(5);
    expect(
      await community
        .locator(".footer-social a")
        .evaluateAll((links) =>
          links.map((link) => link.getAttribute("aria-label")),
        ),
    ).toEqual(
      ["Facebook", "Instagram", "Twitter", "LinkedIn", "YouTube"].map(
        (name) => `${name} (abre em nova aba)`,
      ),
    );
    const title = await community
      .getByRole("heading", { name: "Carteiras compatíveis" })
      .boundingBox();
    const wallet = await community.locator(".wallet-chip").boundingBox();
    expect(wallet?.width).toBeLessThanOrEqual((title?.width ?? 0) + 1);
    await expect(community).toHaveScreenshot("footer-community.png");
  }
  await expect(
    page.getByRole("button", { name: "Cenários de demonstração" }),
  ).toHaveCount(0);
  if (page.viewportSize()!.width < 768) {
    const circles = await page.locator(".market-hero").evaluate((el) =>
      ["::before", "::after"].map((p) => {
        const s = getComputedStyle(el, p);
        return {
          width: s.width,
          height: s.height,
          left: parseFloat(s.left),
          top: parseFloat(s.top),
        };
      }),
    );
    expect(circles[0].width).toBe(circles[1].width);
    expect(circles[0].height).toBe(circles[1].height);
    expect(
      Math.hypot(
        circles[0].left - circles[1].left,
        circles[0].top - circles[1].top,
      ),
    ).toBeGreaterThan(0);
    await page
      .locator(".market-hero")
      .screenshot({ path: "reports/hero-intersection.png" });
  }

  await expect(page).toHaveScreenshot("home.png", {
    fullPage: true,
    animations: "disabled",
  });
  await ready(page, "/nfts/nft-1");
  await expect(page).toHaveTitle("Detalhes do NFT | Kurio");
  await expect(
    page.getByRole("heading", { name: "Emerald Ape #042", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cenários de demonstração" }),
  ).toHaveCount(0);
  await expect(page).toHaveScreenshot("detail.png", {
    fullPage: true,
    animations: "disabled",
  });
  await login(page);
  await add(page);
  await page.getByRole("button", { name: "Fechar notificação" }).click();
  await ready(page, "/cart");
  await expect(page).toHaveTitle("Carrinho de NFTs | Kurio");
  await expect(page.getByTestId("total")).toHaveText("1.206 ETH");
  await expect(
    page.getByRole("button", { name: "Cenários de demonstração" }),
  ).toHaveCount(0);
  await expect(page).toHaveScreenshot("cart.png", {
    fullPage: true,
    animations: "disabled",
  });
  await ready(page, "/checkout");
  await expect(page).toHaveTitle("Finalizar compra | Kurio");
  await expect(
    page.getByRole("radio", { name: "MetaMask", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cenários de demonstração" }),
  ).toHaveCount(0);
  await expect(page).toHaveScreenshot("checkout.png", {
    fullPage: true,
    animations: "disabled",
  });
  await ready(page, "/profile");
  await expect(page).toHaveTitle("Meu perfil | Kurio");
  await expect(page.getByLabel("Nome de exibição")).toHaveValue(
    "Alex Colecionador",
  );
  await expect(
    page.getByRole("button", { name: "Cenários de demonstração" }),
  ).toHaveCount(0);
  await expect(page).toHaveScreenshot("profile.png", {
    fullPage: true,
    animations: "disabled",
  });
  await ready(page, "/wallets");
  await expect(page).toHaveTitle("Minhas carteiras | Kurio");
  await expect(
    page.getByRole("button", { name: "Salvar carteira", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cenários de demonstração" }),
  ).toHaveCount(0);
  await expect(page).toHaveScreenshot("wallets.png", {
    fullPage: true,
    animations: "disabled",
  });
});

test("diagnostic controls require explicit URL opt-in", async ({ page }) => {
  await ready(page, "/?demo=1");
  await page.getByRole("button", { name: "Cenários de demonstração" }).click();
  await expect(
    page.getByRole("dialog", { name: "Cenários de demonstração" }),
  ).toBeVisible();
  await ready(page);
  await expect(
    page.getByRole("heading", { name: "Emerald Ape #042", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cenários de demonstração" }),
  ).toHaveCount(0);
});
