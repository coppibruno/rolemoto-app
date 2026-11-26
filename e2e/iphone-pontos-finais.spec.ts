import { expect, test } from "@playwright/test";
import { entrarComoPiloto } from "./helpers/auth";
import { ColetorAchados } from "./helpers/achados";

test("pontos finais iPhone", async ({ page }) => {
  test.setTimeout(180_000);
  const achados = new ColetorAchados();

  await entrarComoPiloto(page);

  await test.step("localização Explorar", async () => {
    await page.goto("/explorar");
    await page.getByRole("tablist").waitFor({ state: "visible", timeout: 15_000 });
    await achados.tentar("Explorar / localização", "Sheet Alterar localização interativa", async () => {
      await page.getByRole("button", { name: /Localização:|Sua localização|Alterar/i }).first().click({ timeout: 8_000 });
      await expect(page.getByText(/Alterar localização/i).first()).toBeVisible({ timeout: 8_000 });
      const busca = page.getByLabel(/Buscar endereço/i).or(page.getByPlaceholder(/endereço|buscar|cidade/i));
      if ((await busca.count()) > 0) {
        await busca.first().fill("Curitiba", { timeout: 5_000 });
        await page.waitForTimeout(1000);
      }
      // clica Fechar via DOM (evita hang de actionability)
      await page.evaluate(() => {
        const b = [...document.querySelectorAll("button")].find((el) =>
          /fechar/i.test(el.getAttribute("aria-label") || el.textContent || ""),
        );
        (b as HTMLButtonElement | undefined)?.click();
      });
      await page.waitForTimeout(500);
      await page.getByRole("tab", { name: /Rolês/i }).first().click({ timeout: 8_000, force: true });
    });
  });

  await test.step("voltar feed + share + rolê + comentário", async () => {
    await page.goto("/explorar");
    await page.getByRole("tab", { name: /Rolês/i }).first().click({ force: true });
    await page.waitForTimeout(800);
    const href = await page.locator("a[href*='/roles/']").first().getAttribute("href");
    const id = href?.match(/\/roles\/([^/?#]+)/)?.[1];
    if (id) {
      await page.goto(`/roles/${id}/participar`);
      await page.waitForTimeout(2000);
      await achados.tentar("Explorar / rolê", "Voltar ao feed ≠ home", async () => {
        await page.getByRole("button", { name: /Voltar ao feed/i }).first().click({ timeout: 8_000 });
        await page.waitForTimeout(1000);
        if (new URL(page.url()).pathname === "/") throw new Error("caiu na home");
      });
    }

    await page.goto("/");
    await page.locator("article").first().waitFor({ state: "visible", timeout: 20_000 });

    await achados.tentar("Feed / rolê", "Corpo do card não abre detalhe", async () => {
      const card = page.locator("article").filter({ hasText: /criou um rolê/i }).first();
      if ((await card.count()) === 0) {
        achados.add({
          severidade: "aviso",
          area: "Feed / rolê",
          titulo: "Sem card criou um rolê",
          detalhe: "amostra",
        });
        return;
      }
      await card.locator("h3").first().click({ force: true }).catch(() => undefined);
      await page.waitForTimeout(800);
      if (!/\/roles\//.test(page.url())) {
        achados.add({
          severidade: "lacuna",
          area: "Feed / rolê",
          titulo: "Toque no título/corpo não abre detalhe",
          detalhe: page.url(),
        });
      }
    });

    await achados.tentar("Feed / share", "Cards sem compartilhar", async () => {
      let n = 0;
      const cards = page.locator("article");
      const total = Math.min(await cards.count(), 6);
      for (let i = 0; i < total; i++) {
        const t = (await cards.nth(i).innerText()).toLowerCase();
        if (!/(postou uma foto|gravou um rolê|criou um rolê)/.test(t)) continue;
        if ((await cards.nth(i).getByRole("button", { name: /compartilhar/i }).count()) === 0) n++;
      }
      if (n > 0) {
        achados.add({
          severidade: "lacuna",
          area: "Feed / share",
          titulo: `${n} card(s) sem botão compartilhar`,
          detalhe: "conteúdo do feed",
        });
      }
    });

    await achados.tentar(
      "Feed / comentário",
      "Enviar comentário sem travar",
      async () => {
        const card = page.locator("article").filter({ hasText: /gravou um rolê/i }).first();
        await card.getByRole("button", { name: "Comentar" }).click({ timeout: 8_000 });
        const dialog = page.getByRole("dialog", { name: /Comentários/i });
        await expect(dialog).toBeVisible({ timeout: 8_000 });
        await dialog.getByRole("textbox", { name: "Comentário" }).fill(`final ${Date.now()}`);
        await page.evaluate(() => {
          const b = document.querySelector(
            '[aria-label="Enviar comentário"]',
          ) as HTMLButtonElement | null;
          b?.click();
        });
        await page.waitForTimeout(2500);
        await page.evaluate(() => {
          const b = [...document.querySelectorAll("button")].find((el) =>
            /^fechar$/i.test((el.getAttribute("aria-label") || "").trim()),
          );
          (b as HTMLButtonElement | undefined)?.click();
        });
        await page.waitForTimeout(500);
        const dock = page
          .getByRole("navigation", { name: /Navegação principal/i })
          .getByRole("link", { name: /Perfil/i });
        await dock.click({ force: true, timeout: 8_000 });
        await expect(page).toHaveURL(/\/perfil/, { timeout: 10_000 });
      },
      "bloqueio",
    );

    // rotas admin → home para piloto comum?
    for (const rota of ["/criar-evento", "/sugestoes-eventos", "/sugestoes-locais"]) {
      await achados.tentar("Admin", `${rota} para não-admin`, async () => {
        await page.goto(rota);
        await page.waitForTimeout(1200);
        // não deve crashar; redirecionar pra home/login é ok
        const body = await page.locator("body").innerText();
        if (/Application error|Unhandled/i.test(body)) throw new Error("crash");
      });
    }
  });

  const relatorio = achados.relatorio();
  console.log("\n===== PONTOS FINAIS =====\n" + relatorio + "\n=========================\n");
  await test.info().attach("pontos-finais.txt", { body: relatorio, contentType: "text/plain" });
});
