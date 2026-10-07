import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";
import { add, demo, login, ready } from "./helpers";
test("signup, duplicate email validation and session refresh", async ({
  page,
}) => {
  await ready(page, "/signup");
  await page.getByLabel("Nome completo").fill("New Colecionador");
  await page.getByLabel("E-mail", { exact: true }).fill("alex@example.test");
  await page.getByLabel("Senha", { exact: true }).fill("Jungle123!");
  await page.getByLabel("Confirmar senha", { exact: true }).fill("Jungle123!");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByRole("alert")).toContainText("já está cadastrado");
  await page.getByLabel("E-mail", { exact: true }).fill("new@example.test");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).not.toHaveURL(/\/signup/);
  await ready(page, "/profile");
  await expect(page.getByLabel("Nome de exibição")).toHaveValue(
    "New Colecionador",
  );
  await page.reload();
  await expect(page.getByLabel("Nome de exibição")).toHaveValue(
    "New Colecionador",
  );
});
test("session expiration during checkout preserves context and cart; user switch isolates favorites", async ({
  page,
}) => {
  await login(page);
  await add(page);
  await page.getByRole("button", { name: "Adicionar aos favoritos" }).click();
  await ready(page, "/checkout");
  await demo(page, "Expire session", true);
  await expect(page).toHaveURL(/\/login.*returnTo/);
  await page.getByLabel("E-mail", { exact: true }).fill("alex@example.test");
  await page.getByLabel("Senha", { exact: true }).fill("Jungle123!");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/checkout/);
  await expect(page.getByTestId("total")).toHaveText("1.206 ETH");
  // Sign out using the public API through an actual HTTP handler, then observe the guarded page.
  await page.evaluate(async () => {
    const token = localStorage.getItem("jungle.session.token");
    await fetch("/api/session", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  });
  await ready(page, "/profile");
  await expect(page).toHaveURL(/\/login/);
  await login(page, "maya@example.test");
  await ready(page, "/nfts/nft-1");
  await expect(
    page.getByRole("button", { name: "Adicionar aos favoritos" }),
  ).toHaveAttribute("aria-pressed", "false");
  await ready(page, "/cart");
  await expect(
    page.getByRole("heading", { name: "Seu carrinho está vazio" }),
  ).toBeVisible();
});
test("profile, avatar and password persist with server validation", async ({
  page,
}) => {
  await login(page);
  await ready(page, "/profile");
  await page.getByLabel("Nome de exibição").fill("Alex Updated");
  await page
    .getByLabel("Nome de usuário", { exact: true })
    .fill("alex.updated");
  await page.getByLabel("Nome ENS").fill("alex-updated.eth");
  await page.getByLabel("Apelido da carteira").fill("Minha coleção");
  await page.getByLabel("E-mail", { exact: true }).fill("maya@example.test");
  await page.getByRole("button", { name: "Salvar perfil" }).click();
  await expect(page.getByRole("alert")).toContainText("corrija");
  await expect(page.getByText("Este e-mail já está cadastrado.")).toBeVisible();
  await page.getByLabel("E-mail", { exact: true }).fill("alex@example.test");
  await page.getByLabel("Foto do perfil").setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jN1sAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page.getByRole("button", { name: "Salvar perfil" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Perfil salvo." }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Nome de exibição")).toHaveValue("Alex Updated");
  await expect(page.getByLabel("Nome de usuário", { exact: true })).toHaveValue(
    "alex.updated",
  );
  await expect(page.getByLabel("Nome ENS")).toHaveValue("alex-updated.eth");
  await expect(page.getByAltText("Sua foto do perfil")).toBeVisible();
  await page.getByLabel("Senha atual", { exact: true }).fill("Incorrect123");
  await page.getByLabel("Nova senha", { exact: true }).fill("NewJungle123!");
  await page
    .getByLabel("Confirmar nova senha", { exact: true })
    .fill("NewJungle123!");
  await page.getByRole("button", { name: "Salvar senha" }).click();
  await expect(
    page.getByText("A senha atual está incorreta.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Senha atual", { exact: true }).fill("Jungle123!");
  await page.getByRole("button", { name: "Salvar senha" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Senha atualizada." }),
  ).toBeVisible();
  await login(page, "alex@example.test", "NewJungle123!");
});
test("wallet creation, editing, primary selection and validation persist", async ({
  page,
}) => {
  await login(page);
  await ready(page, "/wallets");
  await page.getByLabel("Igual à carteira principal").check();
  await expect(page.getByLabel("Endereço da carteira")).toHaveValue(
    `0x${"a".repeat(40)}`,
  );
  await page.getByLabel("Igual à carteira principal").uncheck();
  await page.getByLabel("Apelido da carteira").fill("Secondary wallet");
  await page.getByLabel("Endereço da carteira").fill("invalid");
  await page.getByRole("button", { name: "Salvar carteira" }).click();
  await expect(
    page.getByText("Use um endereço 0x com 40 caracteres hexadecimais."),
  ).toBeVisible();
  await page.getByLabel("Endereço da carteira").fill(`0x${"c".repeat(40)}`);
  await page.getByLabel("Rede").selectOption("Polygon");
  await page.getByLabel("Definir como carteira principal").check();
  await page.getByRole("button", { name: "Salvar carteira" }).click();
  await expect(
    page.getByRole("heading", { name: "Secondary wallet", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Editar Secondary wallet" }).click();
  await page.getByLabel("Apelido da carteira").fill("Updated Polygon wallet");
  await page.getByRole("button", { name: "Salvar carteira" }).click();
  await expect(
    page.getByRole("heading", { name: "Updated Polygon wallet" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Updated Polygon wallet" }),
  ).toBeVisible();
});

test("account navigation, password visibility and accessible responsive forms", async ({
  page,
}) => {
  await login(page);
  await ready(page, "/profile");
  const menu = page.getByRole("navigation", { name: "Menu do colecionador" });
  await expect(
    menu.getByRole("link", { name: "Dados do perfil" }),
  ).toHaveAttribute("aria-current", "page");
  if (page.viewportSize()!.width < 768) {
    await expect(
      menu.getByRole("button", { name: "Atividade", exact: true }),
    ).toBeHidden();
    await menu.getByRole("link", { name: "Carteiras", exact: true }).click();
    await expect(
      menu.getByRole("link", { name: "Carteiras", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await menu.getByRole("link", { name: "Dados do perfil" }).click();
    const more = menu.locator("summary");
    await more.focus();
    await page.keyboard.press("Enter");
    await expect(
      menu.getByRole("button", { name: "Atividade", exact: true }),
    ).toBeVisible();
  }
  for (const icon of await page.locator("#main img.account-icon").all()) {
    await expect
      .poll(() =>
        icon.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
      )
      .toBe(true);
    const geometry = await icon.evaluate((image: HTMLImageElement) => ({
      rendered: image.getBoundingClientRect().width,
      original: image.naturalWidth,
    }));
    expect(geometry.rendered).toBe(geometry.original);
  }
  for (const label of [
    "Atividade",
    "Lista de interesse",
    "Ofertas",
    "Arquivos baixados",
    "Suporte",
    "Sair",
  ])
    await expect(
      menu.getByRole("button", { name: label, exact: true }),
    ).toBeVisible();
  await page
    .getByRole("button", { name: "Mostrar senha atual", exact: true })
    .click();
  await expect(page.getByLabel("Senha atual", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page
    .getByRole("button", { name: "Ocultar senha atual", exact: true })
    .click();
  await expect(page.getByLabel("Senha atual", { exact: true })).toHaveAttribute(
    "type",
    "password",
  );
  await expect(page.getByLabel("Foto do perfil")).toHaveAttribute(
    "type",
    "file",
  );
  for (const path of ["/profile", "/wallets"]) {
    await ready(page, path);
    await expect(page.getByLabel("Nome ENS", { exact: true })).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    const results = await new AxeBuilder({ page })
      .include("#main")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  }
});
