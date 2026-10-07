import { test, expect, type Locator } from "@playwright/test";
import { ready } from "./helpers";

async function expectCentered(input: Locator, toggle: Locator) {
  const field = await input.boundingBox();
  const button = await toggle.boundingBox();
  expect(field).not.toBeNull();
  expect(button).not.toBeNull();
  expect(
    Math.abs(field!.y + field!.height / 2 - button!.y - button!.height / 2),
  ).toBeLessThan(1);
  expect(button!.x).toBeGreaterThan(field!.x);
  expect(button!.x + button!.width).toBeLessThanOrEqual(
    field!.x + field!.width,
  );
}

test("password toggle stays centered after rejected credentials", async ({
  page,
}) => {
  await ready(page, "/login");
  await page.getByLabel("E-mail", { exact: true }).fill("alex@example.test");
  const password = page.getByLabel("Senha", { exact: true });
  await password.fill("Wrong123!");
  const toggle = page.getByRole("button", {
    name: "Mostrar senha",
    exact: true,
  });
  await expectCentered(password, toggle);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toHaveText(
    "E-mail ou senha incorretos.",
  );
  await expect(
    page.getByText("E-mail ou senha incorretos.", { exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByText("Confira suas credenciais.", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Fechar notificação" }),
  ).toHaveCount(0);
  await expectCentered(password, toggle);
  await toggle.click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(password).toHaveValue("Wrong123!");
  await expectCentered(
    password,
    page.getByRole("button", { name: "Ocultar senha", exact: true }),
  );
  await page.getByRole("dialog").screenshot({
    path: `reports/auth-error-${page.viewportSize()!.width}.png`,
  });
});

test("mobile confirmation toggle stays centered with mismatch feedback", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "mobile",
    "Confirmation visibility control is mobile-only",
  );
  await ready(page, "/signup");
  await page.getByLabel("Senha", { exact: true }).fill("Jungle123!");
  const confirmation = page.getByLabel("Confirmar senha", { exact: true });
  await confirmation.fill("Different123!");
  await expect(page.getByText("As senhas precisam ser iguais.")).toBeVisible();
  const toggle = page.getByRole("button", {
    name: "Mostrar confirmação de senha",
    exact: true,
  });
  await expectCentered(confirmation, toggle);
  await toggle.click();
  await expect(confirmation).toHaveAttribute("type", "text");
  await expectCentered(
    confirmation,
    page.getByRole("button", {
      name: "Ocultar confirmação de senha",
      exact: true,
    }),
  );
});
