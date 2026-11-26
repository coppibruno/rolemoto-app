import { expect, type Page } from "@playwright/test";

export const credenciaisE2e = () => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Defina E2E_EMAIL e E2E_PASSWORD (ou e2e/.env.e2e) para a bateria autenticada.",
    );
  }
  return { email, password };
};

/** Login por e-mail/senha e espera o dock do app autenticado. */
export const entrarComoPiloto = async (page: Page) => {
  const { email, password } = credenciaisE2e();
  await page.goto("/login");
  await page.locator("#login-id").fill(email);
  await page.locator("#login-pass").fill(password);
  await page.getByRole("button", { name: /^Entrar$/ }).click();

  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
  // Primeiro acesso não deve aparecer — perfil já foi criado via API.
  await expect(page).not.toHaveURL(/\/primeiro-acesso/);
  await expect(
    page.getByRole("link", { name: /Início|feed dos amigos/i }).first(),
  ).toBeVisible({ timeout: 30_000 });
};
