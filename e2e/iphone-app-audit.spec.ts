import { expect, test, type Locator, type Page } from "@playwright/test";
import { entrarComoPiloto } from "./helpers/auth";
import { ColetorAchados } from "./helpers/achados";

const tocar = async (alvo: Locator, opcoes?: { force?: boolean }) => {
  await alvo.scrollIntoViewIfNeeded().catch(() => undefined);
  await alvo.click({ timeout: 12_000, force: opcoes?.force });
};

const dismissExtras = async (page: Page) => {
  const agoraNao = page.getByRole("button", { name: /Agora não/i });
  if (await agoraNao.isVisible().catch(() => false)) {
    await agoraNao.click().catch(() => undefined);
  }
  // Next.js devtools às vezes cobre o canto
  await page.locator('[data-nextjs-dev-tools-button], button:has-text("N")').first()
    .click({ force: true, timeout: 1000 })
    .catch(() => undefined);
};

const esperarFeed = async (page: Page) => {
  await page.goto("/");
  await dismissExtras(page);
  await page
    .locator("article")
    .first()
    .waitFor({ state: "visible", timeout: 25_000 })
    .catch(() => undefined);
  await page.waitForTimeout(800);
};

const visivelClicavel = async (alvo: Locator) => {
  await expect(alvo).toBeVisible();
  const box = await alvo.boundingBox();
  if (!box || box.width < 2 || box.height < 2) {
    throw new Error("elemento sem área clicável");
  }
  const noCentro = await alvo.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const topo = document.elementFromPoint(x, y);
    return Boolean(topo && (topo === el || el.contains(topo)));
  });
  if (!noCentro) throw new Error("outro elemento cobre o centro do alvo (z-index/overlay)");
};

const dock = (page: Page) => page.getByRole("navigation", { name: /Navegação principal/i });

const irDock = async (page: Page, nome: RegExp) => {
  await dismissExtras(page);
  const link = dock(page).getByRole("link", { name: nome }).first();
  try {
    await tocar(link);
  } catch {
    // Banner PWA / overlay às vezes cobrem o dock no iPhone viewport
    await tocar(link, { force: true });
  }
};

test.describe.configure({ mode: "serial" });

test("bateria iPhone — auditoria do app autenticado", async ({ page, browserName }) => {
  test.setTimeout(240_000);
  test.skip(
    browserName === "webkit" && process.env.E2E_FORCE_CHROMIUM === "1",
    "WebKit desabilitado neste host",
  );

  const achados = new ColetorAchados();
  const consoleErros: string[] = [];
  page.on("pageerror", (erro) => consoleErros.push(erro.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErros.push(msg.text());
  });

  await test.step("login", async () => {
    await entrarComoPiloto(page);
    await dismissExtras(page);
  });

  await test.step("dock — Início / Explorar / Meus Rolês / Perfil", async () => {
    const alvos: Array<{ nome: RegExp; path: RegExp }> = [
      { nome: /Início/i, path: /\/(\?|$)/ },
      { nome: /Explorar/i, path: /\/explorar/ },
      { nome: /Meus rolês/i, path: /\/meus-roles/ },
      { nome: /Perfil/i, path: /\/perfil/ },
    ];
    for (const alvo of alvos) {
      await achados.tentar("Dock", `Navegar via dock → ${alvo.nome}`, async () => {
        await irDock(page, alvo.nome);
        await expect(page).toHaveURL(alvo.path, { timeout: 15_000 });
      });
      // fallback por URL direta se o dock falhar (ex.: overlay)
      if (!alvo.path.test(new URL(page.url()).pathname + (new URL(page.url()).search || ""))) {
        await page.goto(alvo.path.source.includes("explorar")
          ? "/explorar"
          : alvo.path.source.includes("meus-roles")
            ? "/meus-roles"
            : alvo.path.source.includes("perfil")
              ? "/perfil"
              : "/");
      }
    }
  });

  await test.step("topo do Início permanece interativo", async () => {
    await esperarFeed(page);

    const controles = [
      page.getByRole("button", { name: /tema/i }),
      page.getByRole("link", { name: /Encontrar pilotos/i }).first(),
      page.getByRole("link", { name: /Notificações/i }),
      page.getByRole("link", { name: /Mensagens/i }),
      page.getByRole("button", { name: /Seu perfil/i }),
    ];

    let okTema = false;
    let okOutros = 0;
    for (const [i, el] of controles.entries()) {
      if ((await el.count()) === 0) continue;
      try {
        await visivelClicavel(el);
        if (i === 0) okTema = true;
        else okOutros += 1;
      } catch (erro) {
        achados.add({
          severidade: i === 0 ? "aviso" : "bug",
          area: "Início / topo",
          titulo: `Controle do topo bloqueado: ${await el.getAttribute("aria-label").catch(() => "item")}`,
          detalhe: erro instanceof Error ? erro.message : String(erro),
        });
      }
    }
    if (okTema && okOutros === 0) {
      achados.add({
        severidade: "bug",
        area: "Início / topo",
        titulo: "Só o toggle claro/escuro responde; demais ícones cobertos",
        detalhe: "Reproduz o relato de menus de cima sem interação.",
      });
    }
  });

  await test.step("feed — menu ⋮ não fica atrás da foto", async () => {
    await esperarFeed(page);

    const menus = page.getByRole("button", { name: "Mais ações" });
    const total = await menus.count();
    if (total === 0) {
      achados.add({
        severidade: "aviso",
        area: "Feed",
        titulo: "Sem botão «Mais ações» na timeline",
        detalhe: "Feed ainda sem cards de outros pilotos após seguir.",
      });
      return;
    }

    // Prioriza card de foto (relato: dropdown atrás da imagem)
    const cardFoto = page.locator("article").filter({ hasText: /postou uma foto/i }).first();
    const menu = (await cardFoto.count()) > 0
      ? cardFoto.getByRole("button", { name: "Mais ações" })
      : menus.first();

    await achados.tentar("Feed / ⋮", "Abrir dropdown de moderação e clicar item", async () => {
      await tocar(menu);
      const item = page.getByRole("menuitem").first();
      await expect(item).toBeVisible({ timeout: 5000 });
      await visivelClicavel(item);
      // fecha
      await page.locator("body").click({ position: { x: 8, y: 8 } }).catch(() => undefined);
    });
  });

  await test.step("feed — comentar telemetria sem congelar a UI", async () => {
    await esperarFeed(page);

    const cardTelemetria = page
      .locator("article")
      .filter({ hasText: /gravou um rolê/i })
      .first();

    if ((await cardTelemetria.count()) === 0) {
      achados.add({
        severidade: "aviso",
        area: "Feed / comentário",
        titulo: "Sem card de telemetria no feed",
        detalhe: "Não validou freeze após enviar comentário.",
      });
      return;
    }

    await achados.tentar(
      "Feed / comentário",
      "Enviar comentário em telemetria e continuar interagindo",
      async () => {
        await tocar(cardTelemetria.getByRole("button", { name: "Comentar" }));
        const dialog = page.getByRole("dialog", { name: /Comentários/i });
        await expect(dialog).toBeVisible({ timeout: 10_000 });
        const campo = dialog.getByRole("textbox", { name: "Comentário" });
        await campo.fill(`e2e iphone ${Date.now()}`);
        await tocar(dialog.getByRole("button", { name: "Enviar comentário" }));
        await page.waitForTimeout(3500);

        // Se a folha travar, Fechar/dock falham → bloqueio real
        const fechar = dialog.getByRole("button", { name: /Fechar/i }).first();
        if (await fechar.isVisible().catch(() => false)) await tocar(fechar);
        else await page.keyboard.press("Escape");

        await page.waitForTimeout(600);
        const dockExplorar = dock(page).getByRole("link", { name: /Explorar/i });
        await visivelClicavel(dockExplorar);
        await tocar(dockExplorar, { force: true });
        await expect(page).toHaveURL(/\/explorar/, { timeout: 15_000 });
      },
      "bloqueio",
    );
  });

  await test.step("feed — rolê detalhe + compartilhar", async () => {
    await esperarFeed(page);

    const cardRole = page
      .locator("article")
      .filter({ hasText: /criou um rolê|liderou um rolê/i })
      .first();

    if ((await cardRole.count()) === 0) {
      achados.add({
        severidade: "aviso",
        area: "Feed / rolê",
        titulo: "Sem card de rolê no feed",
        detalhe: "Não validou toque → detalhe.",
      });
    } else {
      await achados.tentar("Feed / rolê", "Toque no card abre detalhe do rolê", async () => {
        // evita o ⋮ / curtir — clica no corpo (mapa/capa) ou CTA
        const cta = cardRole.getByRole("link").or(cardRole.getByRole("button", { name: /ver|participar|detalhe/i }));
        if ((await cta.count()) > 0) await tocar(cta.first());
        else await cardRole.locator("img, canvas, [class*='capa'], [class*='mapa']").first().click({ force: true });
        await page.waitForTimeout(2500);
        if (!/\/roles\//.test(page.url())) {
          throw new Error(`URL após toque não é detalhe de rolê: ${page.url()}`);
        }
        await page.goto("/");
      });

      const temShare =
        (await cardRole.getByRole("button", { name: /compartilhar/i }).count()) > 0;
      if (!temShare) {
        achados.add({
          severidade: "lacuna",
          area: "Feed / rolê",
          titulo: "Falta botão compartilhar (avião) no card do feed",
          detalhe: "Mesma lógica do compartilhar rolê do detalhe/Explorar.",
        });
      }
    }
  });

  await test.step("feed — foto/telemetria sem compartilhar", async () => {
    await esperarFeed(page);
    const cards = page.locator("article");
    const n = Math.min(await cards.count(), 10);
    let viu = false;
    for (let i = 0; i < n; i++) {
      const card = cards.nth(i);
      const texto = (await card.innerText().catch(() => "")).toLowerCase();
      if (!/(postou uma foto|gravou um rolê)/.test(texto)) continue;
      viu = true;
      if ((await card.getByRole("button", { name: /compartilhar/i }).count()) === 0) {
        achados.add({
          severidade: "lacuna",
          area: "Feed / share",
          titulo: "Card de foto/telemetria sem compartilhar",
          detalhe: texto.slice(0, 140),
        });
        break;
      }
    }
    if (!viu) {
      achados.add({
        severidade: "aviso",
        area: "Feed / share",
        titulo: "Sem foto/telemetria no feed para checar share",
        detalhe: "Feed sem esses tipos na amostra.",
      });
    }
  });

  await test.step("Explorar — voltar ao feed após rolê", async () => {
    await page.goto("/explorar");
    await dismissExtras(page);
    await page.getByRole("tablist").waitFor({ state: "visible", timeout: 20_000 });

    for (const aba of [/Rolês/i, /Eventos/i, /Locais/i]) {
      await achados.tentar("Explorar", `Abrir aba ${aba}`, async () => {
        const tab = page.getByRole("tab", { name: aba });
        await expect(tab.first()).toBeVisible({ timeout: 10_000 });
        await tocar(tab.first());
        await page.waitForTimeout(700);
      });
    }

    await achados.tentar(
      "Explorar / rolê",
      "«Voltar ao feed» deve ir para /explorar (não home)",
      async () => {
        await tocar(page.getByRole("tab", { name: /Rolês/i }).first());
        await page.waitForTimeout(1500);

        const card = page.locator("a[href*='/roles/']").first();
        await expect(card).toBeVisible({ timeout: 15_000 });
        const href = await card.getAttribute("href");
        const id = href?.match(/\/roles\/([^/?#]+)/)?.[1];
        if (!id) throw new Error(`href de rolê inesperado: ${href}`);

        // abre o fluxo de participação (onde existe «Voltar ao feed»)
        await page.goto(`/roles/${id}/participar`);
        await page.waitForTimeout(3000);
        const voltar = page.getByRole("button", { name: /Voltar ao feed/i }).or(
          page.getByRole("link", { name: /Voltar ao feed/i }),
        );
        await expect(voltar.first()).toBeVisible({ timeout: 15_000 });
        await tocar(voltar.first());
        await page.waitForTimeout(1500);
        const path = new URL(page.url()).pathname;
        if (path === "/") {
          throw new Error(`Voltar ao feed caiu na home (${page.url()})`);
        }
        if (!path.startsWith("/explorar")) {
          throw new Error(`Voltar ao feed foi para ${page.url()}, esperado /explorar`);
        }
      },
    );
  });

  await test.step("telemetria — foto expandível", async () => {
    await esperarFeed(page);

    const linkTel = page.locator("a[href*='/telemetria/'], article").filter({ hasText: /gravou um rolê/i }).first();
    if ((await page.locator("a[href*='/telemetria/']").count()) === 0 && (await linkTel.count()) === 0) {
      achados.add({
        severidade: "aviso",
        area: "Telemetria",
        titulo: "Sem telemetria no feed",
        detalhe: "Não validou expandir foto.",
      });
      return;
    }

    await achados.tentar("Telemetria", "Foto do passeio deve ser expansível", async () => {
      const direto = page.locator("a[href*='/telemetria/']").first();
      if ((await direto.count()) > 0) await tocar(direto);
      else await tocar(linkTel.locator("button").first());

      await page.waitForURL(/\/telemetria\//, { timeout: 15_000 });
      await page.waitForTimeout(1500);

      const foto = page.getByRole("img", { name: /Foto/i }).first();
      if ((await foto.count()) === 0) {
        achados.add({
          severidade: "aviso",
          area: "Telemetria",
          titulo: "Passeio sem fotos anexadas",
          detalhe: page.url(),
        });
        return;
      }

      const clicavel = await foto.evaluate((el) => {
        const btn = el.closest("button, a, [role='button']");
        return Boolean(btn);
      });
      if (!clicavel) {
        throw new Error(
          "img da telemetria não está em botão/link — não dá para expandir como em evento/local",
        );
      }
      await tocar(foto);
      await page.waitForTimeout(800);
      const lightbox =
        (await page.getByRole("dialog").count()) > 0 ||
        (await page.locator("[class*='lightbox'], [class*='Lightbox'], [class*='amplia']").count()) > 0;
      if (!lightbox) throw new Error("toque na foto não abriu lightbox");
    });
  });

  await test.step("story — localização fora do catálogo", async () => {
    await page.goto("/stories");
    await page.waitForTimeout(1500);
    const campoLocal = page.getByPlaceholder(/Local \(ex\.:/i);
    if ((await campoLocal.count()) === 0) {
      const atalho = page.getByRole("button", { name: /localiza|onde|lugar/i }).first();
      if ((await atalho.count()) > 0) await tocar(atalho).catch(() => undefined);
    }
    if ((await campoLocal.count()) === 0) {
      achados.add({
        severidade: "aviso",
        area: "Story / localização",
        titulo: "Composer não abriu campo de localização",
        detalhe: "Fluxo depende de câmera/perm — validação parcial.",
      });
      return;
    }
    await achados.tentar(
      "Story / localização",
      "Aceita texto livre fora do catálogo de locais",
      async () => {
        await campoLocal.fill("Serra do Corvo Branco E2E");
        await expect(
          page.getByRole("button", { name: /Usar «Serra do Corvo Branco E2E»/i }),
        ).toBeVisible({ timeout: 5000 });
      },
    );
  });

  await test.step("rotas smoke autenticadas", async () => {
    for (const rota of [
      "/pilotos",
      "/notificacoes",
      "/mensagens",
      "/criar-role",
      "/gravar-role",
      "/perfil/fotos/nova",
      "/aprovacoes",
    ]) {
      await achados.tentar("Rotas", `Abrir ${rota}`, async () => {
        const res = await page.goto(rota);
        if (res && res.status() >= 500) throw new Error(`HTTP ${res.status()}`);
        await expect(page.locator("body")).not.toContainText(
          /Application error|Unhandled Runtime Error/i,
        );
        if (/\/login/.test(page.url())) {
          throw new Error("redirecionou para login com sessão autenticada");
        }
      });
    }
  });

  if (consoleErros.length > 0) {
    const unicos = [...new Set(consoleErros)].slice(0, 8);
    achados.add({
      severidade: "aviso",
      area: "Console",
      titulo: `${consoleErros.length} erro(s) de console durante a bateria`,
      detalhe: unicos.join(" | "),
    });
  }

  const relatorio = achados.relatorio();
  await test.info().attach("relatorio-iphone.txt", {
    body: relatorio,
    contentType: "text/plain",
  });
  console.log("\n===== RELATÓRIO IPHONE =====\n" + relatorio + "\n============================\n");

  // Não falha a suíte por lacunas/avisos — só por bloqueio de UI
  const bloqueios = achados.itens.filter((a) => a.severidade === "bloqueio");
  expect(bloqueios, relatorio).toHaveLength(0);
});
