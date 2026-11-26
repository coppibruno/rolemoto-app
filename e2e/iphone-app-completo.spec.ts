import { expect, test, type Locator, type Page } from "@playwright/test";
import { entrarComoPiloto } from "./helpers/auth";
import { ColetorAchados } from "./helpers/achados";

const tocar = async (alvo: Locator, force = false) => {
  await alvo.scrollIntoViewIfNeeded().catch(() => undefined);
  await alvo.click({ timeout: 8_000, force });
};

const dismiss = async (page: Page) => {
  const btn = page.getByRole("button", { name: /Agora não/i });
  if (await btn.isVisible().catch(() => false)) await btn.click().catch(() => undefined);
};

const semCrash = async (page: Page) => {
  const txt = await page.locator("body").innerText().catch(() => "");
  if (/Application error|Unhandled Runtime Error/i.test(txt)) {
    throw new Error("crash React na tela");
  }
  if (/\/login/.test(page.url())) throw new Error("caiu no login");
};

const abrir = async (
  page: Page,
  achados: ColetorAchados,
  area: string,
  rota: string,
  assertTexto?: RegExp,
) => {
  await achados.tentar(area, `Abrir ${rota}`, async () => {
    const res = await page.goto(rota, { waitUntil: "domcontentloaded", timeout: 20_000 });
    if (res && res.status() >= 500) throw new Error(`HTTP ${res.status()}`);
    await page.waitForTimeout(600);
    await dismiss(page);
    await semCrash(page);
    if (assertTexto) {
      await expect(page.getByText(assertTexto).first()).toBeVisible({ timeout: 8_000 });
    }
  });
};

test("bateria iPhone — passagem completa pelo app", async ({ page }) => {
  test.setTimeout(600_000);
  const achados = new ColetorAchados();
  const consoleErros: string[] = [];
  page.on("pageerror", (e) => consoleErros.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") consoleErros.push(m.text());
  });

  try {
    await entrarComoPiloto(page);
    await dismiss(page);

    await test.step("Início", async () => {
      await page.goto("/");
      await dismiss(page);
      await page.locator("article").first().waitFor({ state: "visible", timeout: 20_000 }).catch(() => undefined);

      await achados.tentar("Início", "Feed com cards", async () => {
        if ((await page.locator("article").count()) === 0) throw new Error("sem articles");
      });

      for (const [nome, sel] of [
        ["tema", page.getByRole("button", { name: /tema/i })],
        ["pilotos", page.getByRole("link", { name: /Encontrar pilotos/i }).first()],
        ["notificações", page.getByRole("link", { name: /Notificações/i })],
        ["mensagens", page.getByRole("link", { name: /Mensagens/i })],
      ] as const) {
        await achados.tentar("Início / topo", `«${nome}» clicável`, async () => {
          await expect(sel).toBeVisible({ timeout: 5_000 });
          const ok = await sel.evaluate((el) => {
            const r = el.getBoundingClientRect();
            const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            return Boolean(t && (t === el || el.contains(t)));
          });
          if (!ok) throw new Error("coberto por overlay");
        });
      }

      await achados.tentar("Início", "Seu story", async () => {
        await tocar(page.getByRole("button", { name: /Seu story/i }).first(), true);
        await page.waitForTimeout(1000);
        const ok =
          /stories|fotos/.test(page.url()) ||
          (await page.getByRole("dialog").count()) > 0 ||
          (await page.locator("input[type='file']").count()) > 0;
        if (!ok) throw new Error(`não abriu — ${page.url()}`);
      });
    });

    await test.step("Explorar", async () => {
      await page.goto("/explorar");
      await dismiss(page);
      await page.getByRole("tablist").waitFor({ state: "visible", timeout: 15_000 });

      await achados.tentar("Explorar / localização", "Alterar localização", async () => {
        const painel = page.getByRole("button", { name: /Localização:|Alterar|Sua localização/i }).first();
        await tocar(painel);
        await page.waitForTimeout(600);
        await expect(page.getByText(/Alterar localização/i).first()).toBeVisible({ timeout: 8_000 });
        const busca = page.getByLabel(/Buscar endereço/i).or(page.getByPlaceholder(/endereço|rua|cidade|buscar/i));
        if ((await busca.count()) > 0) {
          await busca.first().fill("Curitiba");
          await page.waitForTimeout(1200);
        }
        // tenta interagir depois — se travou, falha
        const fechar = page.getByRole("button", { name: /Fechar/i }).first();
        if (await fechar.isVisible().catch(() => false)) await tocar(fechar, true);
        else await page.keyboard.press("Escape");
        await page.waitForTimeout(400);
        await tocar(page.getByRole("tab", { name: /Eventos/i }).first(), true);
      });

      for (const aba of [/Rolês/i, /Eventos/i, /Locais/i]) {
        await achados.tentar("Explorar", `Aba ${aba}`, async () => {
          await tocar(page.getByRole("tab", { name: aba }).first(), true);
          await page.waitForTimeout(500);
        });
      }

      await achados.tentar("Explorar / evento", "Detalhe evento", async () => {
        await tocar(page.getByRole("tab", { name: /Eventos/i }).first(), true);
        await page.waitForTimeout(800);
        const card = page.locator("a[href*='/eventos/']").first();
        await expect(card).toBeVisible({ timeout: 12_000 });
        await tocar(card);
        await expect(page).toHaveURL(/\/eventos\//, { timeout: 12_000 });
        await semCrash(page);
      });

      await achados.tentar("Explorar / local", "Detalhe local", async () => {
        await page.goto("/explorar");
        await tocar(page.getByRole("tab", { name: /Locais/i }).first(), true);
        await page.waitForTimeout(800);
        const card = page.locator("a[href*='/locais/']").first();
        await expect(card).toBeVisible({ timeout: 12_000 });
        await tocar(card);
        await expect(page).toHaveURL(/\/locais\//, { timeout: 12_000 });
        await semCrash(page);
      });

      await achados.tentar("Explorar / rolê", "Voltar ao feed ≠ home", async () => {
        await page.goto("/explorar");
        await tocar(page.getByRole("tab", { name: /Rolês/i }).first(), true);
        await page.waitForTimeout(800);
        const card = page.locator("a[href*='/roles/']").first();
        await expect(card).toBeVisible({ timeout: 12_000 });
        const href = await card.getAttribute("href");
        const id = href?.match(/\/roles\/([^/?#]+)/)?.[1];
        if (!id) throw new Error(`href ${href}`);
        await page.goto(`/roles/${id}/participar`);
        await page.waitForTimeout(2000);
        const voltar = page.getByRole("button", { name: /Voltar ao feed/i });
        await expect(voltar.first()).toBeVisible({ timeout: 12_000 });
        await tocar(voltar.first());
        await page.waitForTimeout(1000);
        const path = new URL(page.url()).pathname;
        if (path === "/") throw new Error("Voltar ao feed caiu na home");
        if (!path.startsWith("/explorar")) throw new Error(`foi para ${page.url()}`);
      });
    });

    await test.step("Criar / garagem / perfil / social / catálogo", async () => {
      await abrir(page, achados, "Criar", "/criar-role", /título|destino|ritmo|saída/i);
      await abrir(page, achados, "Criar", "/gravar-role");
      await abrir(page, achados, "Criar", "/perfil/fotos/nova");
      await abrir(page, achados, "Criar", "/criar-evento");
      await abrir(page, achados, "Criar", "/criar-local");

      await abrir(page, achados, "Garagem", "/meus-roles");
      await achados.tentar("Garagem", "Alternar tipos", async () => {
        const tabs = page.getByRole("tab");
        const n = Math.min(await tabs.count(), 3);
        for (let i = 0; i < n; i++) {
          await tocar(tabs.nth(i), true);
          await page.waitForTimeout(400);
        }
      });

      await abrir(page, achados, "Perfil", "/perfil", /Editar perfil/i);
      await achados.tentar("Perfil", "Editar perfil", async () => {
        await tocar(page.getByRole("button", { name: /Editar perfil/i }));
        await page.waitForTimeout(500);
        await expect(page.locator("input").first()).toBeVisible({ timeout: 6_000 });
      });
      await abrir(page, achados, "Perfil", "/perfil/bloqueados");
      await abrir(page, achados, "Perfil", "/perfil/1MdxTz9juOOSJkCeyvamr0ftAWe2");
      await abrir(page, achados, "Perfil", "/perfil/1MdxTz9juOOSJkCeyvamr0ftAWe2/seguindo");

      await abrir(page, achados, "Social", "/pilotos");
      await achados.tentar("Social", "Busca piloto", async () => {
        const busca = page.getByRole("searchbox").or(page.getByPlaceholder(/busca|nome|apelido/i));
        if ((await busca.count()) === 0) throw new Error("sem busca");
        await busca.first().fill("coppi");
        await page.waitForTimeout(1000);
      });
      await abrir(page, achados, "Social", "/notificacoes");
      await abrir(page, achados, "Social", "/mensagens");
      await abrir(page, achados, "Social", "/aprovacoes");

      await abrir(page, achados, "Catálogo", "/conquistas");
      await abrir(page, achados, "Catálogo", "/ranking");
      await abrir(page, achados, "Catálogo", "/locais");
      await abrir(page, achados, "Catálogo", "/afiliados");
      await abrir(page, achados, "Admin", "/sugestoes-eventos");
      await abrir(page, achados, "Admin", "/sugestoes-locais");
      await abrir(page, achados, "Admin", "/eventos-passados");
      await abrir(page, achados, "Admin", "/series-evento");
    });

    await test.step("Telemetria + feed ações", async () => {
      await page.goto("/");
      await page.locator("article").first().waitFor({ state: "visible", timeout: 18_000 }).catch(() => undefined);

      await achados.tentar("Telemetria", "Abrir passeio", async () => {
        const card = page.locator("article").filter({ hasText: /gravou um rolê/i }).first();
        if ((await card.count()) === 0) throw new Error("sem telemetria");
        const cta = card.getByRole("link", { name: /Ver traçado/i });
        if ((await cta.count()) > 0) await tocar(cta.first());
        else throw new Error("sem CTA Ver traçado");
        await expect(page).toHaveURL(/\/telemetria\//, { timeout: 12_000 });
        await semCrash(page);
        const fotos = page.getByRole("img", { name: /Foto/i });
        if ((await fotos.count()) > 0) {
          const clicavel = await fotos.first().evaluate((el) => Boolean(el.closest("button,a,[role=button]")));
          if (!clicavel) {
            achados.add({
              severidade: "bug",
              area: "Telemetria",
              titulo: "Foto não expansível",
              detalhe: page.url(),
            });
          }
        } else {
          achados.add({
            severidade: "aviso",
            area: "Telemetria",
            titulo: "Sem fotos neste passeio",
            detalhe: page.url(),
          });
        }
      });

      await page.goto("/");
      await page.locator("article").first().waitFor({ state: "visible", timeout: 15_000 });

      await achados.tentar("Feed", "Share ausente em conteúdo", async () => {
        const cards = page.locator("article");
        const n = Math.min(await cards.count(), 5);
        let faltando = 0;
        for (let i = 0; i < n; i++) {
          const t = (await cards.nth(i).innerText()).toLowerCase();
          if (!/(postou uma foto|gravou um rolê|criou um rolê)/.test(t)) continue;
          if ((await cards.nth(i).getByRole("button", { name: /compartilhar/i }).count()) === 0) faltando++;
        }
        if (faltando > 0) {
          achados.add({
            severidade: "lacuna",
            area: "Feed / share",
            titulo: `${faltando} card(s) sem compartilhar`,
            detalhe: "foto/telemetria/rolê",
          });
        }
      });

      await achados.tentar("Feed / ⋮", "Menu moderação", async () => {
        await tocar(page.getByRole("button", { name: "Mais ações" }).first());
        await expect(page.getByRole("menuitem").first()).toBeVisible({ timeout: 5_000 });
        await page.keyboard.press("Escape");
      });

      await achados.tentar(
        "Feed / comentário",
        "Enviar e continuar navegando",
        async () => {
          const card = page.locator("article").filter({ hasText: /gravou um rolê/i }).first();
          await tocar(card.getByRole("button", { name: "Comentar" }));
          const dialog = page.getByRole("dialog", { name: /Comentários/i });
          await expect(dialog).toBeVisible({ timeout: 8_000 });
          await dialog.getByRole("textbox", { name: "Comentário" }).fill(`tour full ${Date.now()}`);
          await tocar(dialog.getByRole("button", { name: "Enviar comentário" }), true);
          await page.waitForTimeout(2500);
          const fechar = dialog.getByRole("button", { name: /Fechar/i }).first();
          if (await fechar.isVisible().catch(() => false)) await tocar(fechar, true);
          else await page.keyboard.press("Escape");
          await tocar(
            page.getByRole("navigation", { name: /Navegação principal/i }).getByRole("link", { name: /Perfil/i }),
            true,
          );
          await expect(page).toHaveURL(/\/perfil/, { timeout: 10_000 });
        },
        "bloqueio",
      );

      await achados.tentar("Feed / rolê", "Corpo do card não navega sozinho", async () => {
        await page.goto("/");
        await page.waitForTimeout(1000);
        const card = page.locator("article").filter({ hasText: /criou um rolê/i }).first();
        if ((await card.count()) === 0) {
          achados.add({
            severidade: "aviso",
            area: "Feed / rolê",
            titulo: "Sem card «criou um rolê» na amostra",
            detalhe: "não validou toque no corpo",
          });
          return;
        }
        const antes = page.url();
        await card.locator("h3, [class*='capa'], [class*='titulo']").first().click({ force: true }).catch(() => undefined);
        await page.waitForTimeout(1000);
        if (/\/roles\//.test(page.url()) && page.url() !== antes) return;
        achados.add({
          severidade: "lacuna",
          area: "Feed / rolê",
          titulo: "Toque no corpo do card não abre detalhe",
          detalhe: `URL ficou ${page.url()}`,
        });
      });
    });
  } finally {
    if (consoleErros.length > 0) {
      achados.add({
        severidade: "aviso",
        area: "Console",
        titulo: `${consoleErros.length} erro(s) de console`,
        detalhe: [...new Set(consoleErros)].slice(0, 10).join(" | "),
      });
    }
    const relatorio = achados.relatorio();
    await test.info().attach("relatorio-completo.txt", {
      body: relatorio,
      contentType: "text/plain",
    });
    console.log("\n===== RELATÓRIO COMPLETO IPHONE =====\n" + relatorio + "\n=====================================\n");
  }
});
