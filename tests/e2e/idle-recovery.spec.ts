import { test, expect } from "@playwright/test";
import { add } from "./helpers";

test("reactivates the mock before the first write after inactivity", async ({
  page,
  context,
}) => {
  await page.goto("/nfts/nft-1");
  await expect(
    page.getByRole("heading", { name: "Emerald Ape #042", exact: true }),
  ).toBeVisible();
  const cdp = await context.newCDPSession(page);
  await cdp.send("ServiceWorker.enable");
  await cdp.send("ServiceWorker.stopAllWorkers");
  await cdp.detach();
  // Advance wall time without a slow sleep; only the application idle gate uses it.
  await page.clock.setFixedTime(new Date(Date.now() + 60_000));
  await page.getByRole("button", { name: "Comprar NFT", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "NFT adicionado" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      async () => (await (await fetch("/api/cart")).json()).items[0].quantity,
    ),
  ).toBe(1);
});

test("recovers a terminated mock worker without reload and preserves the guest cart", async ({
  page,
  context,
}) => {
  await add(page);
  let htmlResponses = 0;
  page.on("response", (response) => {
    if (
      response.url().includes("/api/") &&
      response.headers()["content-type"]?.includes("text/html")
    )
      htmlResponses++;
  });
  const navigationCount = await page.evaluate(
    () => performance.getEntriesByType("navigation").length,
  );
  const cdp = await context.newCDPSession(page);
  await cdp.send("ServiceWorker.enable");
  await cdp.send("ServiceWorker.stopAllWorkers");
  await cdp.detach();
  await page.locator(".detail-back").click();
  await expect(
    page.getByRole("link", { name: /Sage Nomad #009, digital artwork/ }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: /Sage Nomad #009, digital artwork/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Sage Nomad #009", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Não foi possível carregar este conteúdo"),
  ).toHaveCount(0);
  expect(htmlResponses).toBeGreaterThan(0);
  await page
    .getByRole("link", {
      name: test.info().project.name === "mobile" ? "Ver carrinho" : "Cart (1)",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Emerald Ape #042", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => performance.getEntriesByType("navigation").length,
    ),
  ).toBe(navigationCount);
});

test("does not replay a write after an invalid response; explicit retry succeeds", async ({
  page,
  context,
}) => {
  await page.goto("/nfts/nft-1");
  await expect(
    page.getByRole("heading", { name: "Emerald Ape #042", exact: true }),
  ).toBeVisible();
  let writes = 0;
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      request.url().endsWith("/api/cart/items")
    )
      writes++;
  });
  // Isolate the invalid write from background reads that could recover the worker first.
  await page.route("**/api/**", async (route) => {
    if (route.request().url().endsWith("/_mock-health"))
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ transport: "jungle-msw" }),
      });
    if (route.request().method() === "GET") return route.abort();
    if (route.request().url().endsWith("/cart/items"))
      return route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<!doctype html><title>SPA fallback</title>",
      });
    return route.continue();
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send("ServiceWorker.enable");
  await cdp.send("ServiceWorker.stopAllWorkers");
  await cdp.detach();
  await page.getByRole("button", { name: "Comprar NFT", exact: true }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Não foi possível recuperar a conexão" }),
  ).toBeVisible();
  expect(writes).toBe(1);
  await page.unroute("**/api/**");
  expect(
    await page.evaluate(
      async () => (await (await fetch("/api/cart")).json()).items.length,
    ),
  ).toBe(0);
  await page.getByRole("button", { name: "Comprar NFT", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "NFT adicionado" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      async () => (await (await fetch("/api/cart")).json()).items[0].quantity,
    ),
  ).toBe(1);
  expect(writes).toBe(2);
});

test("first write recovers a terminated worker even before the idle threshold", async ({
  page,
  context,
}) => {
  await page.goto("/nfts/nft-1");
  await expect(
    page.getByRole("heading", { name: "Emerald Ape #042", exact: true }),
  ).toBeVisible();
  let writes = 0;
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      request.url().endsWith("/api/cart/items")
    )
      writes++;
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send("ServiceWorker.enable");
  await cdp.send("ServiceWorker.stopAllWorkers");
  await cdp.detach();
  // Do not advance time or navigate: a background GET must not hide this failure.
  await page.getByRole("button", { name: "Comprar NFT", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "NFT adicionado" }),
  ).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "Não foi possível" }),
  ).toHaveCount(0);
  expect(writes).toBe(1);
  expect(
    await page.evaluate(
      async () => (await (await fetch("/api/cart")).json()).items[0].quantity,
    ),
  ).toBe(1);
});
