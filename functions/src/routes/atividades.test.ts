import type {AddressInfo} from "node:net";
import type {Server} from "node:http";
import express from "express";
import type {NextFunction, Request, Response} from "express";
import {afterAll, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import type {
  Atividade,
  AtividadeCreate,
  ComentarioAtividade,
  ComentarioAtividadeCreate,
} from "../types/atividade";
import type {ComentarioPost, ComentarioPostCreate, PostFoto} from "../types/post-foto";

const HORA = 60 * 60 * 1000;

const banco = vi.hoisted(() => ({
  atividades: new Map<string, Atividade>(),
  curtidas: new Set<string>(),
  comentarios: new Map<string, ComentarioAtividade>(),
  posts: new Map<string, PostFoto>(),
  comentariosPost: new Map<string, ComentarioPost>(),
  seguindo: new Map<string, string[]>(),
  roles: new Map<string, {id: string; criadorId: string; dataHoraSaida: string}>(),
  confirmados: new Map<string, number>(),
  telemetrias: new Map<string, {id: string; publica: boolean}>(),
  removidas: [] as string[],
  push: [] as Array<{tipo: string; para: string; url?: string; titulo?: string}>,
  seq: 0,
}));

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

vi.mock("../lib/firebase-admin", () => ({firestore: {}, adminStorage: {}, adminAuth: {}}));

vi.mock("../lib/notificacoes", () => ({
  notificarComentarioFoto: async (para: string) => {
    banco.push.push({tipo: "comentario_foto", para});
  },
  notificarComentarioAtividade: async (
    para: string,
    id: string,
    _tipo: string,
    nome: string,
  ) => {
    banco.push.push({tipo: "comentario_atividade", para, url: `/atividades/${id}`, titulo: nome});
  },
}));

vi.mock("../repositories", () => {
  const novoId = (p: string) => {
    banco.seq += 1;
    return `${p}${String(banco.seq).padStart(4, "0")}`;
  };
  const desc = <T extends {createdAt: string; id: string}>(itens: T[]) =>
    [...itens].sort((a, b) =>
      Date.parse(b.createdAt) - Date.parse(a.createdAt) || (a.id < b.id ? 1 : -1));
  const removerAtividade = async (id: string) => {
    banco.removidas.push(id);
    banco.atividades.delete(id);
    for (const c of [...banco.curtidas]) if (c.endsWith(`_${id}`)) banco.curtidas.delete(c);
    for (const [cid, c] of banco.comentarios) if (c.atividadeId === id) banco.comentarios.delete(cid);
  };

  const atividadeRepository = {
    registrar: async (dados: AtividadeCreate) => {
      if (banco.atividades.has(dados.id)) return false;
      banco.atividades.set(dados.id, {...dados, totalCurtidas: 0, totalComentarios: 0});
      return true;
    },
    buscarPorId: async (id: string) => banco.atividades.get(id) ?? null,
    remover: removerAtividade,
    removerPorAlvo: async () => 0,
    paginaPorAutores: async (lotes: string[][], cursor: string | null, limite: number) => {
      const marco = cursor ? banco.atividades.get(cursor) : undefined;
      if (cursor && !marco) return {ok: false as const};
      const depois = (a: Atividade) => !marco ||
        Date.parse(a.createdAt) < Date.parse(marco.createdAt) ||
        (a.createdAt === marco.createdAt && a.id < marco.id);
      return {
        ok: true as const,
        listas: lotes.map((lote) =>
          desc([...banco.atividades.values()].filter((a) => lote.includes(a.autorId) && depois(a)))
            .slice(0, limite)),
      };
    },
    contarNovidades: async (lotes: string[][], desde: string, limite: number) => {
      const marco = banco.atividades.get(desde);
      if (!marco) return 0;
      const n = [...banco.atividades.values()].filter((a) =>
        lotes.flat().includes(a.autorId) && Date.parse(a.createdAt) > Date.parse(marco.createdAt));
      return Math.min(limite, n.length);
    },
    curtidasDe: async (uid: string, ids: string[]) =>
      new Set(ids.filter((id) => banco.curtidas.has(`${uid}_${id}`))),
    curtir: async (uid: string, id: string, criar?: AtividadeCreate) => {
      let a = banco.atividades.get(id);
      if (!a && criar) {
        a = {...criar, totalCurtidas: 0, totalComentarios: 0};
        banco.atividades.set(id, a);
      }
      if (!a) return {tipo: "ausente" as const};
      if (banco.curtidas.has(`${uid}_${id}`)) {
        return {tipo: "ok" as const, mudou: false, totalCurtidas: a.totalCurtidas};
      }
      banco.curtidas.add(`${uid}_${id}`);
      a.totalCurtidas += 1;
      return {tipo: "ok" as const, mudou: true, totalCurtidas: a.totalCurtidas};
    },
    descurtir: async (uid: string, id: string) => {
      const a = banco.atividades.get(id);
      if (!a) return {tipo: "ausente" as const};
      if (!banco.curtidas.delete(`${uid}_${id}`)) {
        return {tipo: "ok" as const, mudou: false, totalCurtidas: a.totalCurtidas};
      }
      a.totalCurtidas = Math.max(0, a.totalCurtidas - 1);
      return {tipo: "ok" as const, mudou: true, totalCurtidas: a.totalCurtidas};
    },
    listarComentarios: async (id: string) => ({
      ok: true as const,
      itens: desc([...banco.comentarios.values()].filter((c) => c.atividadeId === id)),
      proximoCursor: null,
    }),
    buscarComentario: async (id: string) => banco.comentarios.get(id) ?? null,
    comentar: async (dados: ComentarioAtividadeCreate) => {
      const a = banco.atividades.get(dados.atividadeId);
      if (!a) return {tipo: "ausente" as const};
      const c = {...dados, id: novoId("c"), createdAt: new Date().toISOString()};
      banco.comentarios.set(c.id, c);
      a.totalComentarios += 1;
      return {tipo: "criado" as const, comentario: c};
    },
    apagarComentario: async (c: ComentarioAtividade) => {
      banco.comentarios.delete(c.id);
      const a = banco.atividades.get(c.atividadeId);
      if (a) a.totalComentarios = Math.max(0, a.totalComentarios - 1);
    },
  };

  const usuario = (uid: string) => ({uid, nome: `Piloto ${uid}`, apelido: uid, fotoUrl: ""});

  return {
    atividadeRepository,
    seguirRepository: {
      listarSeguidosRecentes: async (uid: string) => banco.seguindo.get(uid) ?? [],
    },
    usuarioRepository: {
      buscarPorId: async (uid: string) => usuario(uid),
      buscarPorIds: async (uids: string[]) => uids.map(usuario),
    },
    postFotoRepository: {
      buscarPorId: async (id: string) => banco.posts.get(id) ?? null,
      buscarPorIds: async (ids: string[]) =>
        ids.flatMap((id) => banco.posts.has(id) ? [banco.posts.get(id) as PostFoto] : []),
      listarComentarios: async (postId: string) => ({
        ok: true as const,
        itens: [...banco.comentariosPost.values()].filter((c) => c.postId === postId),
        proximoCursor: null,
      }),
      comentar: async (dados: ComentarioPostCreate) => {
        const post = banco.posts.get(dados.postId);
        if (!post) return {tipo: "post_ausente" as const};
        const c = {...dados, id: novoId("cp"), createdAt: new Date().toISOString()};
        banco.comentariosPost.set(c.id, c);
        post.totalComentarios += 1;
        return {tipo: "criado" as const, comentario: c};
      },
      buscarComentario: async (id: string) => banco.comentariosPost.get(id) ?? null,
      apagarComentario: async (c: ComentarioPost) => {
        banco.comentariosPost.delete(c.id);
      },
    },
    roleTelemetriaRepository: {
      buscarPorId: async (id: string) => {
        const t = banco.telemetrias.get(id);
        return t ? {
          ...t,
          titulo: "Serra",
          distanciaKm: 80,
          tempoMovimentoSegundos: 3600,
          velocidadeMediaKmh: 70,
          velocidadeMaxKmh: 140,
          pontoInicio: {nome: "A", endereco: ""},
          pontoFim: {nome: "B", endereco: ""},
          tracado: "",
          medalhas: [{conquistaId: "m1", nome: "Pico", novidade: "primeira", velocidadeMaxKmh: 140}],
        } : null;
      },
    },
    roleRepository: {
      buscarPorIds: async (ids: string[]) => ids.flatMap((id) => {
        const r = banco.roles.get(id);
        return r ? [{
          ...r,
          titulo: `Rolê ${id}`,
          fotoCapaUrl: "",
          ritmo: "moderada",
          acesso: "aberto",
          localSaida: {nome: "Posto", endereco: ""},
          destinoFinal: {nome: "Serra", endereco: ""},
        }] : [];
      }),
      listar: async (c: {dataInicioIso: string; dataFimIso: string}) =>
        [...banco.roles.values()].filter((r) =>
          r.dataHoraSaida >= c.dataInicioIso && r.dataHoraSaida <= c.dataFimIso),
    },
    usuarioRoleRepository: {
      contarConfirmados: async (id: string) => banco.confirmados.get(id) ?? 0,
      buscarPorId: async () => null,
      listarConfirmadosDoRole: async () => [],
    },
    eventoRepository: {buscarPorIds: async () => []},
    localRepository: {buscarPorIds: async () => []},
    usuarioEventoRepository: {buscarPorId: async () => null},
    usuarioLocalFeedbackRepository: {buscarPorIds: async () => []},
    usuarioEventoFeedbackRepository: {buscarPorIds: async () => []},
  };
});

const {feedRouter} = await import("./feed");
const {atividadesRouter} = await import("./atividades");
const {registrarRolesRealizados} = await import("../lib/atividade-jobs");

let server: Server;
let base = "";

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use("/feed", feedRouter);
  app.use("/atividades", atividadesRouter);
  server = app.listen(0);
  await new Promise((ok) => server.once("listening", ok));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
});

beforeEach(() => {
  banco.atividades.clear();
  banco.curtidas.clear();
  banco.comentarios.clear();
  banco.posts.clear();
  banco.comentariosPost.clear();
  banco.seguindo.clear();
  banco.roles.clear();
  banco.confirmados.clear();
  banco.telemetrias.clear();
  banco.removidas = [];
  banco.push = [];
});

type Json = Record<string, unknown>;

const chamar = async (metodo: string, caminho: string, uid: string, body?: unknown) => {
  const res = await fetch(`${base}${caminho}`, {
    method: metodo,
    headers: {"Content-Type": "application/json", "x-uid": uid},
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const ehJson = res.headers.get("content-type")?.includes("json");
  return {status: res.status, json: (ehJson ? await res.json() : {}) as Json};
};

const agora = Date.now();
const iso = (horasAtras: number) => new Date(agora - horasAtras * HORA).toISOString();

const post = (id: string, autor: string, horasAtras = 0) => {
  banco.posts.set(id, {
    id,
    usuarioId: autor,
    fotoUrl: `https://f/${id}.jpg`,
    storagePath: "",
    legenda: "",
    marcaTipo: null,
    marcaId: null,
    totalComentarios: 0,
    createdAt: iso(horasAtras),
  });
  banco.atividades.set(`foto_${id}`, {
    id: `foto_${id}`,
    tipo: "foto",
    autorId: autor,
    alvoTipo: "post",
    alvoId: id,
    refId: id,
    totalCurtidas: 0,
    totalComentarios: 0,
    createdAt: iso(horasAtras),
  });
};

const telemetria = (id: string, autor: string, publica = true) => {
  banco.telemetrias.set(id, {id, publica});
  banco.atividades.set(`telemetria_${id}`, {
    id: `telemetria_${id}`,
    tipo: "telemetria",
    autorId: autor,
    alvoTipo: "telemetria",
    alvoId: id,
    refId: id,
    totalCurtidas: 0,
    totalComentarios: 0,
    createdAt: iso(0),
  });
};

const itens = (json: Json) => json.itens as Json[];

describe("FA3 — leitura", () => {
  it("traz o token e quem ele segue; nada de quem não segue", async () => {
    banco.seguindo.set("ana", ["beto"]);
    post("p1", "ana", 1);
    post("p2", "beto", 2);
    post("p3", "caio", 0);
    const res = await chamar("GET", "/feed/amigos", "ana");
    expect(res.status).toBe(200);
    expect(itens(res.json).map((i) => i.id)).toEqual(["foto_p1", "foto_p2"]);
    expect(res.json.proximoCursor).toBeNull();
  });

  it("com 45 seguidos ativos a segunda página continua sem repetir nem pular", async () => {
    const seguidos = Array.from({length: 45}, (_, i) => `u${i}`);
    banco.seguindo.set("ana", seguidos);
    seguidos.forEach((uid, i) => post(`p${i}`, uid, i));
    const primeira = await chamar("GET", "/feed/amigos", "ana");
    expect(itens(primeira.json)).toHaveLength(20);
    const segunda = await chamar(
      "GET",
      `/feed/amigos?cursor=${primeira.json.proximoCursor}`,
      "ana",
    );
    const terceira = await chamar(
      "GET",
      `/feed/amigos?cursor=${segunda.json.proximoCursor}`,
      "ana",
    );
    const todos = [...itens(primeira.json), ...itens(segunda.json), ...itens(terceira.json)]
      .map((i) => i.id);
    expect(todos).toEqual(seguidos.map((_, i) => `foto_p${i}`));
    expect(terceira.json.proximoCursor).toBeNull();
  });

  it("cursor inexistente dá 400; sem nada dá lista vazia", async () => {
    expect(await chamar("GET", "/feed/amigos?cursor=nada", "ana"))
      .toEqual({status: 400, json: {erro: "cursor inválido"}});
    expect((await chamar("GET", "/feed/amigos", "ana")).json)
      .toEqual({itens: [], proximoCursor: null});
  });

  it("origem apagada ou telemetria privada some e é removida", async () => {
    post("p1", "ana", 1);
    telemetria("t1", "ana", false);
    banco.atividades.set("role_criado_r9", {
      id: "role_criado_r9",
      tipo: "role_criado",
      autorId: "ana",
      alvoTipo: "role",
      alvoId: "r9",
      refId: "r9",
      totalCurtidas: 0,
      totalComentarios: 0,
      createdAt: iso(2),
    });
    const res = await chamar("GET", "/feed/amigos", "ana");
    expect(itens(res.json).map((i) => i.id)).toEqual(["foto_p1"]);
    await new Promise((ok) => setTimeout(ok, 10));
    expect(banco.removidas.sort()).toEqual(["role_criado_r9", "telemetria_t1"]);
  });

  it("medalha sai sem velocidade", async () => {
    telemetria("t1", "ana");
    const res = await chamar("GET", "/feed/amigos", "ana");
    const alvo = itens(res.json)[0]?.alvo as Json;
    expect(alvo.medalhas).toEqual([{conquistaId: "m1", nome: "Pico", novidade: "primeira"}]);
    expect(JSON.stringify(res.json)).not.toContain("velocidadeMaxKmh");
  });

  it("novidades conta só o que é mais novo que desde", async () => {
    banco.seguindo.set("ana", ["beto"]);
    post("p1", "ana", 5);
    post("p2", "beto", 1);
    post("p3", "beto", 0);
    expect((await chamar("GET", "/feed/amigos/novidades?desde=foto_p1", "ana")).json)
      .toEqual({total: 2});
    expect((await chamar("GET", "/feed/amigos/novidades?desde=nada", "ana")).json)
      .toEqual({total: 0});
  });

  it("GET /atividades/:id devolve o item ou 404", async () => {
    post("p1", "ana");
    expect((await chamar("GET", "/atividades/foto_p1", "beto")).json)
      .toMatchObject({id: "foto_p1", tipo: "foto", totalAutores: 1, podeCurtir: true});
    expect((await chamar("GET", "/atividades/nada", "beto")).status).toBe(404);
  });
});

describe("FA4 — curtida", () => {
  it("curtir duas vezes conta uma; descurtir sem curtida não fica negativo", async () => {
    post("p1", "ana");
    expect(await chamar("POST", "/atividades/foto_p1/curtida", "beto"))
      .toEqual({status: 201, json: {curtido: true, totalCurtidas: 1}});
    expect(await chamar("POST", "/atividades/foto_p1/curtida", "beto"))
      .toEqual({status: 200, json: {curtido: true, totalCurtidas: 1}});
    expect((await chamar("DELETE", "/atividades/foto_p1/curtida", "caio")).json)
      .toEqual({curtido: false, totalCurtidas: 1});
    expect((await chamar("DELETE", "/atividades/foto_p1/curtida", "beto")).json)
      .toEqual({curtido: false, totalCurtidas: 0});
    expect((await chamar("DELETE", "/atividades/foto_p1/curtida", "beto")).json)
      .toEqual({curtido: false, totalCurtidas: 0});
    const item = itens((await chamar("GET", "/feed/amigos", "ana")).json)[0];
    expect(item?.totalCurtidas).toBe(0);
  });

  it("post sem atividade ganha a atividade na primeira curtida; inexistente dá 404", async () => {
    post("p1", "ana", 3);
    banco.atividades.delete("foto_p1");
    expect((await chamar("POST", "/atividades/foto_p1/curtida", "beto")).status).toBe(201);
    expect(banco.atividades.get("foto_p1")).toMatchObject({autorId: "ana", createdAt: iso(3)});
    expect((await chamar("POST", "/atividades/foto_nada/curtida", "beto")).status).toBe(404);
  });

  it("o card mostra curtidoPorMim do leitor", async () => {
    post("p1", "ana");
    await chamar("POST", "/atividades/foto_p1/curtida", "ana");
    const item = itens((await chamar("GET", "/feed/amigos", "ana")).json)[0];
    expect(item).toMatchObject({curtidoPorMim: true, totalCurtidas: 1});
  });
});

describe("FA5 — comentário", () => {
  it("telemetria manda comentario_atividade ao dono; no próprio item não", async () => {
    telemetria("t1", "ana");
    const res = await chamar("POST", "/atividades/telemetria_t1/comentarios", "beto", {texto: " boa "});
    expect(res.status).toBe(201);
    expect(res.json).toMatchObject({texto: "boa", podeApagar: true, autor: {uid: "beto"}});
    expect(banco.push).toEqual([
      {tipo: "comentario_atividade", para: "ana", url: "/atividades/telemetria_t1", titulo: "beto"},
    ]);
    await chamar("POST", "/atividades/telemetria_t1/comentarios", "ana", {texto: "valeu"});
    expect(banco.push).toHaveLength(1);
    expect(banco.atividades.get("telemetria_t1")?.totalComentarios).toBe(2);
  });

  it("foto grava no post e manda comentario_foto", async () => {
    post("p1", "ana");
    const res = await chamar("POST", "/atividades/foto_p1/comentarios", "beto", {texto: "top"});
    expect(res.status).toBe(201);
    expect([...banco.comentariosPost.values()].map((c) => c.texto)).toEqual(["top"]);
    expect(banco.posts.get("p1")?.totalComentarios).toBe(1);
    expect(banco.push).toEqual([{tipo: "comentario_foto", para: "ana"}]);
    const lista = await chamar("GET", "/atividades/foto_p1/comentarios", "caio");
    expect(itens(lista.json).map((c) => c.texto)).toEqual(["top"]);
  });

  it("compacto responde 400; texto vazio também", async () => {
    banco.roles.set("r1", {id: "r1", criadorId: "ana", dataHoraSaida: iso(-24)});
    banco.atividades.set("entrada_role_beto_r1", {
      id: "entrada_role_beto_r1",
      tipo: "entrada_role",
      autorId: "beto",
      alvoTipo: "role",
      alvoId: "r1",
      refId: "beto_r1",
      totalCurtidas: 0,
      totalComentarios: 0,
      createdAt: iso(0),
    });
    expect(await chamar("POST", "/atividades/entrada_role_beto_r1/comentarios", "ana", {texto: "x"}))
      .toEqual({status: 400, json: {erro: "este item não aceita comentário"}});
    telemetria("t1", "ana");
    expect((await chamar("POST", "/atividades/telemetria_t1/comentarios", "beto", {texto: " "}))
      .json.erro).toBe("escreva um comentário");
  });

  it("o autor da atividade apaga comentário de outro; terceiro recebe 403", async () => {
    telemetria("t1", "ana");
    const c = (await chamar("POST", "/atividades/telemetria_t1/comentarios", "beto", {texto: "x"}))
      .json;
    expect(await chamar("DELETE", `/atividades/telemetria_t1/comentarios/${c.id}`, "caio"))
      .toEqual({status: 403, json: {erro: "não dá para apagar"}});
    expect((await chamar("DELETE", `/atividades/telemetria_t1/comentarios/${c.id}`, "ana")).status)
      .toBe(204);
    expect(banco.atividades.get("telemetria_t1")?.totalComentarios).toBe(0);
  });
});

describe("FA6 — rolê realizado", () => {
  it("saiu há 8 h com confirmado ganha; sem confirmado não; rodar de novo não duplica", async () => {
    banco.roles.set("r1", {id: "r1", criadorId: "ana", dataHoraSaida: iso(8)});
    banco.roles.set("r2", {id: "r2", criadorId: "ana", dataHoraSaida: iso(8)});
    banco.roles.set("r3", {id: "r3", criadorId: "ana", dataHoraSaida: iso(2)});
    banco.confirmados.set("r1", 2);
    banco.confirmados.set("r3", 2);
    expect(await registrarRolesRealizados(new Date(agora))).toEqual({criados: 1});
    expect(banco.atividades.get("role_realizado_r1")).toMatchObject({autorId: "ana", alvoId: "r1"});
    expect(banco.atividades.has("role_realizado_r2")).toBe(false);
    expect(await registrarRolesRealizados(new Date(agora))).toEqual({criados: 0});
  });
});
