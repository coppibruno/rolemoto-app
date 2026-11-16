import type {AddressInfo} from "node:net";
import type {Server} from "node:http";
import express from "express";
import type {NextFunction, Request, Response} from "express";
import {afterAll, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import type {Mensagem, MensagemNova} from "../types/conversa";

const espias = vi.hoisted(() => ({
  enviar: vi.fn(),
  marcarLida: vi.fn(async () => undefined),
  contarNaoLidas: vi.fn(async () => 3),
  listarMensagens: vi.fn(async () => ({ok: true, itens: [], proximoCursor: null})),
  notificarMensagem: vi.fn(async () => undefined),
  marcarCurtida: vi.fn(async () => undefined),
}));

const MENSAGEM_BIA: Mensagem = {
  id: "mb",
  conversaId: "ana_bia",
  autorId: "bia",
  texto: "bora?",
  storyId: null,
  reacao: null,
  curtida: false,
  createdAt: "",
};

vi.mock("../lib/log", () => ({
  log: {info: vi.fn(), warn: vi.fn(), error: vi.fn()},
  erroDe: (e: unknown) => ({detalhe: String(e)}),
}));

vi.mock("../middleware/rate-limit", () => ({
  rateLimitAutenticado: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock("../middleware/auth", () => ({
  autenticar: (req: Request, res: Response, next: NextFunction) => {
    const uid = req.headers["x-uid"];
    if (typeof uid !== "string") {
      res.status(401).json({erro: "Token ausente"});
      return;
    }
    req.usuario = {uid, email: undefined, claims: {} as never};
    next();
  },
}));

vi.mock("../lib/notificacoes", () => ({notificarMensagem: espias.notificarMensagem}));

const STORY_BIA = {id: "s1", usuarioId: "bia", fotoUrl: "https://x/f.jpg", expiresAt: ""};

vi.mock("../repositories", () => ({
  conversaRepository: {
    enviar: espias.enviar,
    marcarLida: espias.marcarLida,
    contarNaoLidas: espias.contarNaoLidas,
    listarMensagens: espias.listarMensagens,
    marcarCurtida: espias.marcarCurtida,
    buscarMensagem: async (id: string) => (id === MENSAGEM_BIA.id ? {...MENSAGEM_BIA} : null),
    listarDoUsuario: async () => ({ok: true, itens: [], proximoCursor: null}),
  },
  storyLocalRepository: {
    buscarPorId: async (id: string) => (id === STORY_BIA.id ? STORY_BIA : null),
  },
  usuarioRepository: {
    buscarPorId: async (uid: string) => ({uid, nome: uid, apelido: uid, fotoUrl: ""}),
    buscarPorIds: async () => [],
  },
}));

const {conversasRouter} = await import("./conversas");

let server: Server;
let base = "";

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use("/conversas", conversasRouter);
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
});

beforeEach(() => {
  STORY_BIA.expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  espias.enviar.mockReset();
  espias.enviar.mockImplementation(async (dados: MensagemNova): Promise<Mensagem> => ({
    id: "m1",
    conversaId: dados.conversaId,
    autorId: dados.autorId,
    texto: dados.texto,
    storyId: dados.storyId,
    reacao: dados.reacao,
    curtida: false,
    createdAt: new Date().toISOString(),
  }));
  espias.marcarLida.mockClear();
  espias.marcarCurtida.mockClear();
  MENSAGEM_BIA.curtida = false;
  espias.notificarMensagem.mockClear();
});

const chamar = async (metodo: string, caminho: string, body?: unknown, uid = "ana") => {
  const res = await fetch(`${base}${caminho}`, {
    method: metodo,
    headers: {"Content-Type": "application/json", "x-uid": uid},
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const texto = await res.text();
  return {status: res.status, json: texto ? JSON.parse(texto) : null};
};

describe("reação ao story", () => {
  it("grava o emoji como texto, a reação e o resumo; push fala da reação", async () => {
    const res = await chamar("POST", "/conversas", {
      destinatarioId: "bia",
      storyId: "s1",
      reacao: "fogo",
      texto: "ignorado",
    });
    expect(res.status).toBe(201);
    expect(res.json.mensagem.texto).toBe("🔥");
    expect(res.json.mensagem.reacao).toBe("fogo");
    const dados = espias.enviar.mock.calls[0][0] as MensagemNova;
    expect(dados.resumo).toBe("Reagiu ao seu story 🔥");
    expect(espias.notificarMensagem).toHaveBeenCalledWith(
      "bia", "ana_bia", "ana", "Reagiu ao seu story 🔥",
    );
  });

  it("reação fora da lista ou sem story é 400", async () => {
    const invalida = await chamar("POST", "/conversas", {
      destinatarioId: "bia", storyId: "s1", reacao: "toString",
    });
    expect(invalida.status).toBe(400);
    const semStory = await chamar("POST", "/conversas", {destinatarioId: "bia", reacao: "riso"});
    expect(semStory.status).toBe(400);
    expect(espias.enviar).not.toHaveBeenCalled();
  });

  it("story vencida recusa a reação", async () => {
    STORY_BIA.expiresAt = new Date(Date.now() - 1000).toISOString();
    const res = await chamar("POST", "/conversas", {
      destinatarioId: "bia", storyId: "s1", reacao: "palmas",
    });
    expect(res.status).toBe(400);
  });

  it("mensagem comum segue com texto e reacao null", async () => {
    const res = await chamar("POST", "/conversas", {destinatarioId: "bia", texto: " oi "});
    expect(res.status).toBe(201);
    expect(res.json.mensagem.reacao).toBeNull();
    expect((espias.enviar.mock.calls[0][0] as MensagemNova).resumo).toBe("oi");
  });
});

describe("curtida", () => {
  const caminho = "/conversas/ana_bia/mensagens/mb/curtida";

  it("quem recebeu curte e descurte", async () => {
    const put = await chamar("PUT", caminho);
    expect(put.status).toBe(200);
    expect(put.json).toEqual({curtida: true});
    expect(espias.marcarCurtida).toHaveBeenCalledWith("mb", true);
    MENSAGEM_BIA.curtida = true;
    const del = await chamar("DELETE", caminho);
    expect(del.json).toEqual({curtida: false});
    expect(espias.marcarCurtida).toHaveBeenLastCalledWith("mb", false);
  });

  it("repetir o mesmo estado não grava de novo", async () => {
    MENSAGEM_BIA.curtida = true;
    const res = await chamar("PUT", caminho);
    expect(res.status).toBe(200);
    expect(espias.marcarCurtida).not.toHaveBeenCalled();
  });

  it("o autor não curte a própria mensagem", async () => {
    const res = await chamar("PUT", caminho, undefined, "bia");
    expect(res.status).toBe(400);
    expect(espias.marcarCurtida).not.toHaveBeenCalled();
  });

  it("fora da conversa ou mensagem de outra conversa é 404", async () => {
    const intruso = await chamar("PUT", caminho, undefined, "caio");
    expect(intruso.status).toBe(404);
    const outra = await chamar("PUT", "/conversas/ana_caio/mensagens/mb/curtida");
    expect(outra.status).toBe(404);
    expect(espias.marcarCurtida).not.toHaveBeenCalled();
  });
});

describe("não lidas", () => {
  it("GET /nao-lidas devolve o total do token", async () => {
    const res = await chamar("GET", "/conversas/nao-lidas");
    expect(res.status).toBe(200);
    expect(res.json).toEqual({total: 3});
    expect(espias.contarNaoLidas).toHaveBeenCalledWith("ana");
  });

  it("abrir a página mais recente marca lida; página antiga não", async () => {
    await chamar("GET", "/conversas/ana_bia/mensagens");
    expect(espias.marcarLida).toHaveBeenCalledWith("ana_bia", "ana");
    espias.marcarLida.mockClear();
    await chamar("GET", "/conversas/ana_bia/mensagens?cursor=m9");
    expect(espias.marcarLida).not.toHaveBeenCalled();
  });

  it("falha ao marcar lida não derruba a leitura", async () => {
    espias.marcarLida.mockRejectedValueOnce(new Error("firestore fora"));
    const res = await chamar("GET", "/conversas/ana_bia/mensagens");
    expect(res.status).toBe(200);
  });
});
