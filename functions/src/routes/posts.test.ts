import type {AddressInfo} from "node:net";
import type {Server} from "node:http";
import express from "express";
import type {NextFunction, Request, Response} from "express";
import {afterAll, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import type {
  ComentarioPost,
  ComentarioPostCreate,
  PostFoto,
  PostFotoCreate,
} from "../types/post-foto";
import type {StoryLocal, StoryLocalCreate} from "../types/story-local";

const DIA_MS = 24 * 60 * 60 * 1000;

const banco = vi.hoisted(() => ({
  posts: new Map<string, PostFoto>(),
  comentarios: new Map<string, ComentarioPost>(),
  stories: new Map<string, StoryLocal>(),
  arquivos: new Map<string, string>(),
  usuarios: new Set<string>(),
  locais: new Map<string, string>(),
  eventos: new Map<string, string>(),
  seq: 0,
  relogio: 0,
  falharLimpezaPosts: false,
  push: [] as Array<{autor: string; postId: string; nome: string}>,
  pushStory: 0,
  falharPush: false,
}));

const proximoId = (prefixo: string): string => {
  banco.seq += 1;
  return `${prefixo}${banco.seq}`;
};

const agoraIso = (): string => {
  banco.relogio += 1;
  return new Date(Date.now() + banco.relogio).toISOString();
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

vi.mock("../lib/firebase-admin", () => {
  const file = (caminho: string) => ({
    download: async () => {
      if (!banco.arquivos.has(caminho)) throw new Error("No such object");
      return [Buffer.from("foto")];
    },
    getMetadata: async () => [{contentType: banco.arquivos.get(caminho)}],
    save: async (_bytes: Buffer, opcoes: {metadata: {contentType: string}}) => {
      banco.arquivos.set(caminho, opcoes.metadata.contentType);
    },
    delete: async () => {
      banco.arquivos.delete(caminho);
    },
  });
  return {
    adminAuth: {deleteUser: vi.fn(async () => undefined)},
    adminStorage: {bucket: () => ({name: "bucket-teste", file})},
    firestore: {},
  };
});

vi.mock("../lib/notificacoes", () => ({
  notificarComentarioFoto: async (autor: string, postId: string, nome: string) => {
    if (banco.falharPush) throw new Error("FCM fora");
    banco.push.push({autor, postId, nome});
  },
  notificarStory: async () => {
    banco.pushStory += 1;
  },
  notificarNovoSeguidor: async () => undefined,
}));

vi.mock("../lib/checkin-local", () => ({
  RAIO_CHECKIN_KM: 0.4,
  validarBodyCheckin: () => ({ok: false, erro: "gps"}),
  hidratarSelosSeVazio: async (_uid: string, selos: unknown[]) => selos,
}));

vi.mock("../lib/conquistas", () => ({
  conquistasDoPerfil: async () => [],
  conquistasPublicas: async () => [],
  semFalhar: async (_c: string, _u: string, fn: () => Promise<unknown>) => fn(),
}));

vi.mock("../repositories", () => {
  const ordenarDesc = <T extends {createdAt: string; id: string}>(itens: T[]) =>
    [...itens].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));

  const paginar = <T extends {id: string}>(
    itens: T[],
    cursor: string | null,
    limite: number,
    cursorValido: (id: string) => boolean,
  ) => {
    let inicio = 0;
    if (cursor) {
      if (!cursorValido(cursor)) return {ok: false as const};
      inicio = itens.findIndex((item) => item.id === cursor) + 1;
    }
    const fatia = itens.slice(inicio, inicio + limite);
    const ultimo = fatia[fatia.length - 1];
    return {
      ok: true as const,
      itens: fatia,
      proximoCursor: fatia.length === limite && ultimo ? ultimo.id : null,
    };
  };

  const apagarComentario = async (c: ComentarioPost) => {
    if (!banco.comentarios.delete(c.id)) return;
    const post = banco.posts.get(c.postId);
    if (post) post.totalComentarios = Math.max(0, post.totalComentarios - 1);
  };

  const removerPost = async (id: string) => {
    for (const [cid, c] of banco.comentarios) {
      if (c.postId === id) banco.comentarios.delete(cid);
    }
    banco.posts.delete(id);
  };

  const postFotoRepository = {
    criarDentroDoTeto: async (
      dados: PostFotoCreate,
      desde: Date,
      dentro: (n: number) => boolean,
    ) => {
      const recentes = [...banco.posts.values()].filter((p) =>
        p.usuarioId === dados.usuarioId && Date.parse(p.createdAt) > desde.getTime(),
      );
      if (!dentro(recentes.length)) return null;
      const post: PostFoto = {
        id: proximoId("post"),
        ...dados,
        totalComentarios: 0,
        createdAt: agoraIso(),
      };
      banco.posts.set(post.id, post);
      return {...post};
    },
    buscarPorId: async (id: string) => {
      const post = banco.posts.get(id);
      return post ? {...post} : null;
    },
    buscarPorIds: async (ids: string[]) =>
      ids.flatMap((id) => banco.posts.has(id) ? [{...banco.posts.get(id) as PostFoto}] : []),
    listarPorUsuario: async (uid: string, cursor: string | null) => paginar(
      ordenarDesc([...banco.posts.values()].filter((p) => p.usuarioId === uid)),
      cursor,
      30,
      (id) => banco.posts.get(id)?.usuarioId === uid,
    ),
    remover: removerPost,
    listarComentarios: async (postId: string, cursor: string | null) => paginar(
      ordenarDesc([...banco.comentarios.values()].filter((c) => c.postId === postId)),
      cursor,
      30,
      (id) => banco.comentarios.get(id)?.postId === postId,
    ),
    buscarComentario: async (id: string) => banco.comentarios.get(id) ?? null,
    comentar: async (dados: ComentarioPostCreate) => {
      const post = banco.posts.get(dados.postId);
      if (!post) return {tipo: "post_ausente" as const};
      const comentario = {id: proximoId("com"), ...dados, createdAt: agoraIso()};
      banco.comentarios.set(comentario.id, comentario);
      post.totalComentarios += 1;
      return {tipo: "criado" as const, comentario};
    },
    apagarComentario,
    limparPorUsuario: async (uid: string) => {
      if (banco.falharLimpezaPosts) throw new Error("forçada");
      const caminhos: string[] = [];
      for (const post of [...banco.posts.values()]) {
        if (post.usuarioId !== uid) continue;
        await removerPost(post.id);
        caminhos.push(post.storagePath);
      }
      for (const c of [...banco.comentarios.values()]) {
        if (c.usuarioId === uid) await apagarComentario(c);
      }
      return caminhos;
    },
  };

  const ativa = (s: StoryLocal, agora = Date.now()) => Date.parse(s.expiresAt) > agora;

  const novaStory = (dados: StoryLocalCreate): StoryLocal => {
    const createdAt = agoraIso();
    const story: StoryLocal = {
      ...dados,
      id: proximoId("story"),
      postId: dados.postId ?? null,
      marcaTipo: dados.marcaTipo ?? null,
      marcaId: dados.marcaId ?? null,
      createdAt,
      expiresAt: new Date(Date.parse(createdAt) + DIA_MS).toISOString(),
    };
    banco.stories.set(story.id, story);
    return story;
  };

  const storyLocalRepository = {
    criar: async (dados: StoryLocalCreate) => novaStory(dados),
    buscarPorId: async (id: string) => banco.stories.get(id) ?? null,
    remover: async (id: string) => {
      banco.stories.delete(id);
    },
    listarPorUsuario: async (uid: string) =>
      [...banco.stories.values()].filter((s) => s.usuarioId === uid),
    listarRecentesNaoExpiradas: async () =>
      [...banco.stories.values()].filter((s) => ativa(s)),
    listarCopiasAtivas: async (uid: string, postId: string, agora: Date) =>
      [...banco.stories.values()].filter((s) =>
        s.usuarioId === uid && s.postId === postId && ativa(s, agora.getTime()),
      ),
    encaminharPost: async (dados: StoryLocalCreate & {postId: string}, teto: number) => {
      const existente = [...banco.stories.values()].find((s) =>
        s.usuarioId === dados.usuarioId && s.postId === dados.postId && ativa(s),
      );
      if (existente) return {tipo: "existente" as const, storyId: existente.id};
      const noPerfil = [...banco.stories.values()].filter((s) =>
        s.usuarioId === dados.usuarioId &&
        s.album === "perfil" &&
        Date.parse(s.createdAt) > Date.now() - DIA_MS,
      );
      if (noPerfil.length >= teto) return {tipo: "teto" as const};
      return {tipo: "criada" as const, storyId: novaStory(dados).id};
    },
    buscarVistos: async () => [],
  };

  const usuario = (uid: string) => ({
    uid,
    nome: `Piloto ${uid}`,
    apelido: uid,
    moto: "XRE",
    tipoMoto: null,
    pilotagem: "moderada",
    fotoUrl: `https://foto/${uid}.jpg`,
    cidade: "",
    garupaFrequente: false,
    admin: false,
    locaisVisitadosUnicos: 0,
    selos: [],
    seguindo: 0,
    seguidores: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
  });

  return {
    postFotoRepository,
    storyLocalRepository,
    usuarioRepository: {
      buscarPorId: async (uid: string) => banco.usuarios.has(uid) ? usuario(uid) : null,
      buscarPorIds: async (uids: string[]) =>
        uids.filter((uid) => banco.usuarios.has(uid)).map(usuario),
      lerCamposBusca: async () => null,
      remover: async (uid: string) => {
        banco.usuarios.delete(uid);
      },
    },
    localRepository: {
      buscarPorId: async (id: string) =>
        banco.locais.has(id) ? {id, nome: banco.locais.get(id)} : null,
      buscarPorIds: async (ids: string[]) =>
        ids.filter((id) => banco.locais.has(id)).map((id) => ({id, nome: banco.locais.get(id)})),
    },
    eventoRepository: {
      buscarPorId: async (id: string) =>
        banco.eventos.has(id) ? {id, titulo: banco.eventos.get(id)} : null,
      buscarPorIds: async (ids: string[]) =>
        ids.filter((id) => banco.eventos.has(id)).map((id) => ({id, titulo: banco.eventos.get(id)})),
    },
    seguirRepository: {limparPorUsuario: async () => undefined},
    dispositivoRepository: {removerPorUid: async () => undefined},
    conviteEventoRepository: {limparPorUsuario: async () => undefined},
    conquistaRepository: {limparPorUsuario: async () => undefined},
    roleTelemetriaRepository: {},
    historicoOcultoRepository: {},
  };
});

const {postsRouter} = await import("./posts");
const {usuariosRouter} = await import("./usuarios");
const {perfilRouter} = await import("./perfil");

let server: Server;
let base = "";

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use("/posts", postsRouter);
  app.use("/usuarios", usuariosRouter);
  app.use("/perfil", perfilRouter);
  server = app.listen(0);
  await new Promise((ok) => server.once("listening", ok));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
});

beforeEach(() => {
  banco.posts.clear();
  banco.comentarios.clear();
  banco.stories.clear();
  banco.arquivos.clear();
  banco.usuarios.clear();
  banco.locais.clear();
  banco.eventos.clear();
  banco.push = [];
  banco.pushStory = 0;
  banco.falharPush = false;
  banco.falharLimpezaPosts = false;
  for (const uid of ["ana", "beto", "caio"]) banco.usuarios.add(uid);
  banco.locais.set("posto1", "Posto da Serra");
  banco.eventos.set("ev1", "Café dos Pilotos");
});

type Json = Record<string, unknown>;

const chamar = async (
  metodo: string,
  caminho: string,
  uid: string | null,
  body?: unknown,
): Promise<{status: number; json: Json}> => {
  const headers: Record<string, string> = {"Content-Type": "application/json"};
  if (uid) headers["x-uid"] = uid;
  const res = await fetch(`${base}${caminho}`, {
    method: metodo,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const ehJson = res.headers.get("content-type")?.includes("json");
  return {status: res.status, json: ehJson ? await res.json() : {}};
};

const urlDe = (caminho: string) =>
  `https://firebasestorage.googleapis.com/v0/b/bucket-teste/o/${encodeURIComponent(caminho)}?alt=media`;

let arquivoSeq = 0;
const subir = (uid: string): string => {
  arquivoSeq += 1;
  const caminho = `posts/${uid}/foto-${arquivoSeq}.jpg`;
  banco.arquivos.set(caminho, "image/jpeg");
  return urlDe(caminho);
};

const publicar = async (uid: string, extra: Json = {}) =>
  chamar("POST", "/posts", uid, {fotoUrl: subir(uid), ...extra});

const idPost = (res: {json: Json}) => (res.json.post as Json).id as string;
const itens = (json: Json) => json.itens as Json[];

describe("FP2 — post", () => {
  it("POST no prefixo do token cria e a grade devolve a foto em primeiro", async () => {
    await publicar("ana");
    const res = await publicar("ana", {legenda: "  serra\ncedo  "});
    expect(res.status).toBe(201);
    expect(res.json.story).toBeNull();
    expect(res.json.erroStory).toBeNull();
    expect(res.json.post).toMatchObject({
      legenda: "serra\ncedo",
      marca: null,
      totalComentarios: 0,
      encaminhadoPorMim: false,
      autor: {uid: "ana", apelido: "ana", fotoUrl: "https://foto/ana.jpg"},
    });
    const grade = await chamar("GET", "/usuarios/ana/posts", "beto");
    expect(grade.status).toBe(200);
    expect(itens(grade.json)[0]?.id).toBe(idPost(res));
    expect(Object.keys(itens(grade.json)[0] ?? {}).sort()).toEqual(["createdAt", "fotoUrl", "id"]);
    expect(grade.json.proximoCursor).toBeNull();
  });

  it("foto de outro prefixo, extensão ruim ou sem token não gravam", async () => {
    const outro = await chamar("POST", "/posts", "ana", {fotoUrl: subir("beto")});
    expect(outro).toEqual({status: 400, json: {erro: "foto inválida"}});
    const gif = await chamar("POST", "/posts", "ana", {fotoUrl: urlDe("posts/ana/a.gif")});
    expect(gif.status).toBe(400);
    expect((await chamar("POST", "/posts", null, {fotoUrl: subir("ana")})).status).toBe(401);
    expect(banco.posts.size).toBe(0);
  });

  it("legenda longa, marca inválida e encaminharStory não booleano dão 400", async () => {
    expect((await publicar("ana", {legenda: "x".repeat(501)})).json.erro)
      .toBe("legenda longa demais");
    expect((await publicar("ana", {marca: {tipo: "rolê", id: "a"}})).json.erro)
      .toBe("marca inválida");
    expect((await publicar("ana", {encaminharStory: "sim"}))).toEqual({
      status: 400,
      json: {erro: "foto inválida"},
    });
    expect(banco.posts.size).toBe(0);
  });

  it("a 11ª foto em 24 h responde 429 e a grade fica com 10", async () => {
    for (let i = 0; i < 10; i += 1) {
      expect((await publicar("ana")).status).toBe(201);
    }
    const onze = await publicar("ana");
    expect(onze).toEqual({status: 429, json: {erro: "Você já publicou 10 fotos hoje"}});
    expect(itens((await chamar("GET", "/usuarios/ana/posts", "ana")).json)).toHaveLength(10);
  });

  it("marca de local e de evento abrem o nome certo; id inexistente dá 404", async () => {
    const local = await publicar("ana", {marca: {tipo: "local", id: "posto1"}});
    expect((local.json.post as Json).marca)
      .toEqual({tipo: "local", id: "posto1", nome: "Posto da Serra"});
    const evento = await publicar("ana", {marca: {tipo: "evento", id: "ev1"}});
    const detalhe = await chamar("GET", `/posts/${idPost(evento)}`, "beto");
    expect(detalhe.json.marca).toEqual({tipo: "evento", id: "ev1", nome: "Café dos Pilotos"});

    const sumida = await publicar("ana", {marca: {tipo: "local", id: "nada"}});
    expect(sumida).toEqual({status: 404, json: {erro: "marca não encontrada"}});

    banco.locais.delete("posto1");
    expect((await chamar("GET", `/posts/${idPost(local)}`, "ana")).json.marca).toBeNull();
  });

  it("GET de post inexistente e grade de perfil inexistente dão 404; cursor ruim 400", async () => {
    expect(await chamar("GET", "/posts/nada", "ana"))
      .toEqual({status: 404, json: {erro: "Foto não encontrada"}});
    expect((await chamar("GET", "/usuarios/zeca/posts", "ana")).status).toBe(404);
    expect(await chamar("GET", "/usuarios/ana/posts?cursor=inventado", "ana"))
      .toEqual({status: 400, json: {erro: "cursor inválido"}});
  });

  it("grade pagina de 30 em 30 pelo id do último", async () => {
    for (let i = 0; i < 31; i += 1) {
      await postFotoCriadoDireto("ana", i);
    }
    const primeira = await chamar("GET", "/usuarios/ana/posts", "beto");
    expect(itens(primeira.json)).toHaveLength(30);
    const cursor = primeira.json.proximoCursor as string;
    expect(cursor).toBe(itens(primeira.json)[29]?.id);
    const segunda = await chamar("GET", `/usuarios/ana/posts?cursor=${cursor}`, "beto");
    expect(itens(segunda.json)).toHaveLength(1);
    expect(segunda.json.proximoCursor).toBeNull();
  });

  it("DELETE do autor tira grade, comentários e arquivo; outro uid recebe 403", async () => {
    const res = await publicar("ana");
    const id = idPost(res);
    const caminho = banco.posts.get(id)?.storagePath as string;
    await chamar("POST", `/posts/${id}/comentarios`, "beto", {texto: "top"});
    await chamar("POST", `/posts/${id}/story`, "beto");

    expect(await chamar("DELETE", `/posts/${id}`, "beto"))
      .toEqual({status: 403, json: {erro: "só o autor apaga"}});
    expect((await chamar("DELETE", `/posts/${id}`, "ana")).status).toBe(204);
    expect(itens((await chamar("GET", "/usuarios/ana/posts", "ana")).json)).toEqual([]);
    expect(banco.comentarios.size).toBe(0);
    expect(banco.arquivos.has(caminho)).toBe(false);
    expect([...banco.stories.values()].filter((s) => s.postId === id)).toHaveLength(1);
    expect((await chamar("DELETE", `/posts/${id}`, "ana")).status).toBe(404);
  });
});

const postFotoCriadoDireto = async (uid: string, i: number) => {
  const post: PostFoto = {
    id: `velho${String(i).padStart(2, "0")}`,
    usuarioId: uid,
    fotoUrl: urlDe(`posts/${uid}/v${i}.jpg`),
    storagePath: `posts/${uid}/v${i}.jpg`,
    legenda: "",
    marcaTipo: null,
    marcaId: null,
    totalComentarios: 0,
    createdAt: new Date(Date.UTC(2026, 0, 1) + i * 1000).toISOString(),
  };
  banco.posts.set(post.id, post);
};

describe("FP3 — comentário e push", () => {
  it("qualquer logado comenta; o autor da foto recebe push; na própria foto não", async () => {
    const id = idPost(await publicar("ana"));
    const res = await chamar("POST", `/posts/${id}/comentarios`, "beto", {texto: "  que estrada  "});
    expect(res.status).toBe(201);
    expect(res.json).toMatchObject({
      texto: "que estrada",
      podeApagar: true,
      autor: {uid: "beto", apelido: "beto"},
    });
    expect(banco.push).toEqual([{autor: "ana", postId: id, nome: "beto"}]);

    await chamar("POST", `/posts/${id}/comentarios`, "ana", {texto: "valeu"});
    expect(banco.push).toHaveLength(1);
    expect(banco.posts.get(id)?.totalComentarios).toBe(2);
  });

  it("texto vazio, longo e post inexistente", async () => {
    const id = idPost(await publicar("ana"));
    expect((await chamar("POST", `/posts/${id}/comentarios`, "beto", {texto: "  "})).json.erro)
      .toBe("escreva um comentário");
    expect((await chamar("POST", `/posts/${id}/comentarios`, "beto", {texto: "a".repeat(281)}))
      .json.erro).toBe("comentário longo demais");
    expect((await chamar("POST", "/posts/nada/comentarios", "beto", {texto: "oi"})).status)
      .toBe(404);
    expect((await chamar("GET", "/posts/nada/comentarios", "beto")).status).toBe(404);
  });

  it("falha do FCM ainda devolve 201 e o comentário está na lista", async () => {
    const id = idPost(await publicar("ana"));
    banco.falharPush = true;
    const res = await chamar("POST", `/posts/${id}/comentarios`, "beto", {texto: "boa"});
    expect(res.status).toBe(201);
    const lista = await chamar("GET", `/posts/${id}/comentarios`, "caio");
    expect(itens(lista.json).map((c) => c.texto)).toEqual(["boa"]);
    expect(lista.json.proximoCursor).toBeNull();
  });

  it("lista do mais novo para o mais antigo com podeApagar por leitor", async () => {
    const id = idPost(await publicar("ana"));
    await chamar("POST", `/posts/${id}/comentarios`, "beto", {texto: "primeiro"});
    await chamar("POST", `/posts/${id}/comentarios`, "caio", {texto: "segundo"});
    const doCaio = itens((await chamar("GET", `/posts/${id}/comentarios`, "caio")).json);
    expect(doCaio.map((c) => [c.texto, c.podeApagar])).toEqual([
      ["segundo", true],
      ["primeiro", false],
    ]);
    const daAna = itens((await chamar("GET", `/posts/${id}/comentarios`, "ana")).json);
    expect(daAna.every((c) => c.podeApagar)).toBe(true);
  });

  it("autor do comentário e autor da foto apagam; terceiro recebe 403; contador acompanha", async () => {
    const id = idPost(await publicar("ana"));
    const c1 = (await chamar("POST", `/posts/${id}/comentarios`, "beto", {texto: "um"})).json;
    const c2 = (await chamar("POST", `/posts/${id}/comentarios`, "beto", {texto: "dois"})).json;
    expect(await chamar("DELETE", `/posts/${id}/comentarios/${c1.id}`, "caio"))
      .toEqual({status: 403, json: {erro: "não dá para apagar"}});
    expect((await chamar("DELETE", `/posts/${id}/comentarios/${c1.id}`, "beto")).status).toBe(204);
    expect((await chamar("DELETE", `/posts/${id}/comentarios/${c2.id}`, "ana")).status).toBe(204);
    expect(banco.posts.get(id)?.totalComentarios).toBe(0);
    expect((await chamar("GET", `/posts/${id}`, "ana")).json.totalComentarios).toBe(0);

    const outro = idPost(await publicar("ana"));
    const c3 = (await chamar("POST", `/posts/${outro}/comentarios`, "beto", {texto: "x"})).json;
    expect(await chamar("DELETE", `/posts/${id}/comentarios/${c3.id}`, "beto"))
      .toEqual({status: 404, json: {erro: "Comentário não encontrado"}});
  });
});

describe("FP4 — story", () => {
  it("encaminhar cria story perfil com cópia do arquivo, sem push story_local", async () => {
    const id = idPost(await publicar("ana", {marca: {tipo: "local", id: "posto1"}}));
    const res = await chamar("POST", `/posts/${id}/story`, "beto");
    expect(res.status).toBe(201);
    const story = banco.stories.get(res.json.storyId as string);
    expect(story).toMatchObject({
      usuarioId: "beto",
      album: "perfil",
      localId: null,
      eventoId: null,
      postId: id,
      marcaTipo: "local",
      marcaId: "posto1",
    });
    expect(story?.storagePath).toMatch(/^stories\/perfil\/beto\/[\w-]+\.jpg$/);
    expect(story?.storagePath).not.toBe(banco.posts.get(id)?.storagePath);
    expect(banco.arquivos.has(story?.storagePath as string)).toBe(true);
    expect(story?.fotoUrl).toContain(encodeURIComponent(story?.storagePath as string));
    expect(banco.pushStory).toBe(0);
    expect((await chamar("GET", `/posts/${id}`, "beto")).json.encaminhadoPorMim).toBe(true);
    expect((await chamar("GET", `/posts/${id}`, "caio")).json.encaminhadoPorMim).toBe(false);
  });

  it("o segundo POST com a cópia no ar devolve 200 e o mesmo storyId", async () => {
    const id = idPost(await publicar("ana"));
    const primeiro = await chamar("POST", `/posts/${id}/story`, "beto");
    const arquivosAntes = banco.arquivos.size;
    const segundo = await chamar("POST", `/posts/${id}/story`, "beto");
    expect(segundo).toEqual({status: 200, json: {storyId: primeiro.json.storyId}});
    expect(banco.arquivos.size).toBe(arquivosAntes);
    expect(banco.stories.size).toBe(1);
  });

  it("a story pública traz publicacao e a mencao da marca; post apagado tira o selo", async () => {
    const id = idPost(await publicar("ana", {marca: {tipo: "evento", id: "ev1"}}));
    await chamar("POST", `/posts/${id}/story`, "beto");
    const antes = await chamar("GET", "/usuarios/beto/stories", "caio");
    const [story] = antes.json.stories as Json[];
    expect(story?.publicacao).toEqual({id, autorUid: "ana"});
    expect(story?.mencao).toEqual({tipo: "evento", id: "ev1", nome: "Café dos Pilotos"});
    expect((story?.autor as Json).uid).toBe("beto");

    await chamar("DELETE", `/posts/${id}`, "ana");
    const depois = await chamar("GET", "/usuarios/beto/stories", "caio");
    expect((depois.json.stories as Json[])[0]?.publicacao).toBeNull();
  });

  it("apagar a story não apaga o post", async () => {
    const id = idPost(await publicar("ana"));
    const {json} = await chamar("POST", `/posts/${id}/story`, "beto");
    expect((await chamar("DELETE", `/usuarios/beto/stories/${json.storyId}`, "beto")).status)
      .toBe(204);
    expect(banco.posts.has(id)).toBe(true);
    expect((await chamar("GET", `/posts/${id}`, "beto")).json.encaminhadoPorMim).toBe(false);
  });

  it("a 6ª story de perfil responde 429; no POST /posts a foto fica e erroStory vem", async () => {
    const ids: string[] = [];
    for (let i = 0; i < 6; i += 1) ids.push(idPost(await publicar("ana")));
    for (let i = 0; i < 5; i += 1) {
      expect((await chamar("POST", `/posts/${ids[i]}/story`, "beto")).status).toBe(201);
    }
    const arquivosAntes = banco.arquivos.size;
    expect(await chamar("POST", `/posts/${ids[5]}/story`, "beto")).toEqual({
      status: 429,
      json: {erro: "Você já postou 5 fotos no seu perfil hoje"},
    });
    expect(banco.arquivos.size).toBe(arquivosAntes);

    for (let i = 0; i < 5; i += 1) await chamar("POST", `/posts/${ids[i]}/story`, "ana");
    const res = await publicar("ana", {encaminharStory: true});
    expect(res.status).toBe(201);
    expect(res.json.story).toBeNull();
    expect(res.json.erroStory).toBe("Você já postou 5 fotos no seu perfil hoje");
    expect(banco.posts.has(idPost(res))).toBe(true);
  });

  it("POST /posts com encaminharStory true cria a story e marca encaminhadoPorMim", async () => {
    const res = await publicar("ana", {encaminharStory: true});
    expect(res.status).toBe(201);
    expect(res.json.story).toEqual({id: expect.any(String)});
    expect(res.json.erroStory).toBeNull();
    expect((res.json.post as Json).encaminhadoPorMim).toBe(true);
  });

  it("post inexistente dá 404", async () => {
    expect(await chamar("POST", "/posts/nada/story", "beto"))
      .toEqual({status: 404, json: {erro: "Foto não encontrada"}});
  });
});

describe("FP5 — conta", () => {
  it("DELETE /perfil remove posts, arquivos e comentários nos dois sentidos", async () => {
    const daAna = idPost(await publicar("ana"));
    const caminho = banco.posts.get(daAna)?.storagePath as string;
    const doBeto = idPost(await publicar("beto"));
    await chamar("POST", `/posts/${daAna}/comentarios`, "beto", {texto: "fica?"});
    await chamar("POST", `/posts/${doBeto}/comentarios`, "ana", {texto: "sai"});
    await chamar("POST", `/posts/${doBeto}/comentarios`, "caio", {texto: "fica"});
    await chamar("POST", `/posts/${daAna}/story`, "caio");
    await chamar("POST", `/posts/${doBeto}/story`, "ana");

    expect((await chamar("DELETE", "/perfil", "ana")).status).toBe(204);
    expect([...banco.posts.values()].map((p) => p.usuarioId)).toEqual(["beto"]);
    expect(banco.arquivos.has(caminho)).toBe(false);
    expect([...banco.comentarios.values()].map((c) => c.texto)).toEqual(["fica"]);
    expect(banco.posts.get(doBeto)?.totalComentarios).toBe(1);
    expect([...banco.stories.values()].map((s) => s.usuarioId)).toEqual(["caio"]);

    const daCaio = await chamar("GET", "/usuarios/caio/stories", "beto");
    expect((daCaio.json.stories as Json[])[0]?.publicacao).toBeNull();
  });

  it("falha na limpeza não impede o 204", async () => {
    await publicar("ana");
    banco.falharLimpezaPosts = true;
    expect((await chamar("DELETE", "/perfil", "ana")).status).toBe(204);
  });
});
