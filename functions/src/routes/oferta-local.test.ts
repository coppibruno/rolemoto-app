import type {AddressInfo} from "node:net";
import type {Server} from "node:http";
import express from "express";
import type {NextFunction, Request, Response} from "express";
import {afterAll, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import type {OfertaLocal, OfertaLocalDados} from "../types/oferta-local";

type LocalMem = {id: string; nome: string; lat: number; lng: number; donoId: string | null};
type UsuarioMem = {nome: string; apelido: string; moto: string; admin: boolean};

const banco = vi.hoisted(() => ({
  locais: new Map<string, LocalMem>(),
  usuarios: new Map<string, UsuarioMem>(),
  ofertas: new Map<string, OfertaLocal>(),
  cupons: new Map<string, {localId: string; createdAt: number}>(),
  checkins: [] as Array<{localId: string; createdAt: number}>,
  seq: 0,
  tick: 0,
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
      res.status(401).json({erro: "Não autenticado"});
      return;
    }
    req.usuario = {uid, email: undefined, claims: {} as never};
    next();
  },
}));

vi.mock("../lib/firebase-admin", () => ({
  adminAuth: {deleteUser: vi.fn(async () => undefined)},
  adminStorage: {bucket: () => ({name: "b", file: () => ({})})},
  firestore: {},
}));

vi.mock("../lib/story-local", () => ({
  detalheStoriesLocal: async () => ({storiesAtivas: 0, eventoAoVivo: null}),
  apagarStoriesDoUsuario: async () => undefined,
}));

vi.mock("../lib/post-foto-publico", () => ({
  apagarPostsDoUsuario: async () => undefined,
}));

vi.mock("../lib/checkin-local", () => ({
  hidratarSelosSeVazio: async (_uid: string, selos: unknown[]) => selos,
  registrarCheckin: async () => ({ok: false, status: 400, erro: "x"}),
  validarBodyCheckin: () => ({ok: false, erro: "x"}),
}));

vi.mock("../lib/conquistas", () => ({
  conquistasDoPerfil: async () => [],
  semFalhar: async (_c: string, _u: string, fn: () => Promise<unknown>) => fn(),
}));

vi.mock("../repositories", () => {
  const agoraIso = () => {
    banco.tick += 1;
    return new Date(Date.UTC(2026, 10, 1) + banco.tick * 1000).toISOString();
  };

  const toLocal = (l: LocalMem) => ({
    id: l.id,
    nome: l.nome,
    endereco: "",
    lat: l.lat,
    lng: l.lng,
    categoria: "posto",
    facilidades: [],
    aberto24h: true,
    horarios: [],
    linkMaps: "",
    fotoFachadaUrl: "",
    fotosUrls: [],
    fotoAtribuicao: "",
    googlePlaceId: null,
    criadorId: "admin",
    notaMedia: 0,
    totalAvaliacoes: 0,
    recomendacoesComboio: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });

  const doLocal = (localId: string) =>
    [...banco.ofertas.values()].filter((o) => o.localId === localId);

  const codigoEmUso = (localId: string, codigo: string, ignorar?: string) =>
    doLocal(localId).some((o) => o.id !== ignorar && o.codigo.toUpperCase() === codigo);

  const usuario = (uid: string) => {
    const u = banco.usuarios.get(uid);
    if (!u) return null;
    return {
      uid,
      ...u,
      tipoMoto: null,
      pilotagem: "moderada",
      fotoUrl: "",
      cidade: "",
      garupaFrequente: false,
      locaisVisitadosUnicos: 0,
      selos: [],
      seguindo: 0,
      seguidores: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
  };

  return {
    localRepository: {
      listar: async () => [...banco.locais.values()].map(toLocal),
      buscarPorId: async (id: string) =>
        banco.locais.has(id) ? toLocal(banco.locais.get(id) as LocalMem) : null,
      buscarComDono: async (id: string) => {
        const l = banco.locais.get(id);
        return l ? {local: toLocal(l), donoId: l.donoId} : null;
      },
      definirDono: async (id: string, donoId: string | null) => {
        (banco.locais.get(id) as LocalMem).donoId = donoId;
      },
      listarPorDono: async (uid: string) =>
        [...banco.locais.values()]
          .filter((l) => l.donoId === uid)
          .map((l) => ({id: l.id, nome: l.nome}))
          .sort((a, b) => a.nome.localeCompare(b.nome)),
    },
    ofertaLocalRepository: {
      listarPorLocal: async (localId: string) =>
        doLocal(localId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      listarAtivas: async () => [...banco.ofertas.values()].filter((o) => o.ativa),
      buscarPorId: async (id: string) => banco.ofertas.get(id) ?? null,
      criar: async (localId: string, dados: OfertaLocalDados, teto: number) => {
        if (doLocal(localId).length >= teto) return {tipo: "teto"};
        if (codigoEmUso(localId, dados.codigo)) return {tipo: "codigo"};
        banco.seq += 1;
        const ts = agoraIso();
        const oferta: OfertaLocal = {
          id: `of${banco.seq}`,
          localId,
          ...dados,
          ativa: true,
          createdAt: ts,
          updatedAt: ts,
        };
        banco.ofertas.set(oferta.id, oferta);
        return {tipo: "criada", oferta};
      },
      atualizar: async (
        id: string,
        localId: string,
        dados: OfertaLocalDados & {ativa: boolean},
      ) => {
        const atual = banco.ofertas.get(id);
        if (!atual || atual.localId !== localId) return {tipo: "ausente"};
        if (codigoEmUso(localId, dados.codigo, id)) return {tipo: "codigo"};
        const oferta = {...atual, ...dados, updatedAt: agoraIso()};
        banco.ofertas.set(id, oferta);
        return {tipo: "atualizada", oferta};
      },
      definirAtiva: async (id: string, ativa: boolean) => {
        const atual = banco.ofertas.get(id);
        if (!atual) return null;
        const oferta = {...atual, ativa, updatedAt: agoraIso()};
        banco.ofertas.set(id, oferta);
        return oferta;
      },
      remover: async (id: string) => {
        banco.ofertas.delete(id);
      },
      pausarPorLocal: async (localId: string) => {
        for (const o of doLocal(localId)) o.ativa = false;
      },
    },
    usuarioOfertaCupomRepository: {
      abrir: async (d: {usuarioId: string; ofertaId: string; localId: string; ymd: string}) => {
        const id = `${d.usuarioId}_${d.ofertaId}_${d.ymd}`;
        if (banco.cupons.has(id)) return {novo: false};
        banco.cupons.set(id, {localId: d.localId, createdAt: Date.now()});
        return {novo: true};
      },
      contarPorLocalDesde: async (localId: string, desde: Date) =>
        [...banco.cupons.values()].filter((c) =>
          c.localId === localId && c.createdAt >= desde.getTime(),
        ).length,
    },
    usuarioLocalCheckinRepository: {
      contarPorLocalDesde: async (localId: string, desde: Date) =>
        banco.checkins.filter((c) => c.localId === localId && c.createdAt >= desde.getTime())
          .length,
    },
    usuarioRepository: {
      buscarPorId: async (uid: string) => usuario(uid),
      buscarAgregadoCheckin: async () => null,
      lerCamposBusca: async () => null,
      remover: async (uid: string) => banco.usuarios.delete(uid),
    },
    usuarioLocalFeedbackRepository: {
      buscarPorIds: async () => [],
      buscarPorUsuarioELocal: async () => null,
    },
    usuarioLocalFavoritoRepository: {
      listarLocalIdsPorUsuario: async () => [],
      buscarPorUsuarioELocal: async () => null,
    },
    seguirRepository: {limparPorUsuario: async () => undefined},
    dispositivoRepository: {removerPorUid: async () => undefined},
    conviteEventoRepository: {limparPorUsuario: async () => undefined},
    conquistaRepository: {limparPorUsuario: async () => undefined},
    historicoOcultoRepository: {},
  };
});

const {locaisRouter} = await import("./locais");
const {perfilRouter} = await import("./perfil");

let server: Server;
let base = "";

/** Quarta, 11/11/2026 15:00 em São Paulo. */
const AGORA = new Date("2026-11-11T15:00:00-03:00");

beforeAll(async () => {
  vi.useFakeTimers({toFake: ["Date"]});
  vi.setSystemTime(AGORA);
  const app = express();
  app.use(express.json());
  app.use("/locais", locaisRouter);
  app.use("/perfil", perfilRouter);
  server = app.listen(0);
  await new Promise((ok) => server.once("listening", ok));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  vi.useRealTimers();
  server.close();
});

beforeEach(() => {
  vi.setSystemTime(AGORA);
  banco.locais.clear();
  banco.usuarios.clear();
  banco.ofertas.clear();
  banco.cupons.clear();
  banco.checkins = [];
  banco.seq = 0;
  banco.tick = 0;
  banco.locais.set("posto", {id: "posto", nome: "Posto Estrela", lat: -27, lng: -48, donoId: "dono"});
  banco.locais.set("bar", {id: "bar", nome: "Bar da Serra", lat: -27.01, lng: -48, donoId: null});
  banco.usuarios.set("admin", {nome: "Ana Admin", apelido: "", moto: "", admin: true});
  banco.usuarios.set("dono", {nome: "Zé Dono", apelido: "ze", moto: "", admin: false});
  banco.usuarios.set("rafa", {nome: "Rafael Souza", apelido: "", moto: "CB 500", admin: false});
});

type Json = Record<string, unknown>;

const chamar = async (
  metodo: string,
  caminho: string,
  uid: string | null,
  body?: unknown,
): Promise<{status: number; json: Json & Json[]}> => {
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

const oferta = (patch: Record<string, unknown> = {}) => ({
  titulo: "Combo do piloto",
  tipo: "preco",
  valor: 32,
  codigo: "moto10",
  regra: "Café e pão de queijo",
  tetoDia: 20,
  dias: [],
  horaInicio: null,
  horaFim: null,
  ...patch,
});

const criar = async (patch: Record<string, unknown> = {}, uid = "dono", localId = "posto") =>
  chamar("POST", `/locais/${localId}/ofertas`, uid, oferta(patch));

describe("VP2 — CRUD da oferta", () => {
  it("dono cria e recebe o shape com código e vigência", async () => {
    const r = await criar();
    expect(r.status).toBe(201);
    expect(r.json).toMatchObject({
      codigo: "MOTO10",
      rotulo: "R$ 32",
      ativa: true,
      vigente: true,
    });
  });

  it("admin também cria, para suporte", async () => {
    expect((await criar({}, "admin")).status).toBe(201);
  });

  it("piloto recebe 403", async () => {
    const r = await criar({}, "rafa");
    expect(r.status).toBe(403);
    expect(r.json.erro).toBe("Sem permissão");
  });

  it("campo inválido responde 400 com a mensagem da lib", async () => {
    const r = await criar({valor: 0});
    expect(r.status).toBe(400);
    expect(r.json.erro).toBe("Informe o preço");
  });

  it("o sexto POST responde 409, contando pausadas", async () => {
    for (let i = 1; i <= 5; i += 1) {
      expect((await criar({codigo: `COD${i}0`})).status).toBe(201);
    }
    const primeira = [...banco.ofertas.values()][0];
    await chamar("PATCH", `/locais/posto/ofertas/${primeira.id}`, "dono", {ativa: false});
    const r = await criar({codigo: "COD60"});
    expect(r.status).toBe(409);
    expect(r.json.erro).toBe("Este local já tem 5 ofertas");
  });

  it("código repetido no local responde 409, sem distinguir maiúsculas", async () => {
    await criar({codigo: "MOTO10"});
    const r = await criar({codigo: "moto10"});
    expect(r.status).toBe(409);
    expect(r.json.erro).toBe("Já existe uma oferta com esse código neste local");
  });

  it("o mesmo código em outro local passa", async () => {
    await criar();
    expect((await criar({}, "admin", "bar")).status).toBe(201);
  });

  it("PUT edita, ignora a própria oferta no 409 e exige ativa", async () => {
    const {json} = await criar();
    const id = json.id as string;
    const semAtiva = await chamar("PUT", `/locais/posto/ofertas/${id}`, "dono", oferta());
    expect(semAtiva.status).toBe(400);
    expect(semAtiva.json.erro).toBe("ativa é obrigatória");
    const ok = await chamar("PUT", `/locais/posto/ofertas/${id}`, "dono", {
      ...oferta({titulo: "Combo novo"}),
      ativa: true,
    });
    expect(ok.status).toBe(200);
    expect(ok.json.titulo).toBe("Combo novo");
  });

  it("oferta de outro local responde 404", async () => {
    const {json} = await criar({}, "admin", "bar");
    const r = await chamar("DELETE", `/locais/posto/ofertas/${json.id}`, "dono");
    expect(r.status).toBe(404);
    expect(r.json.erro).toBe("Oferta não encontrada");
  });

  it("PATCH sem boolean responde 400", async () => {
    const {json} = await criar();
    const r = await chamar("PATCH", `/locais/posto/ofertas/${json.id}`, "dono", {ativa: "x"});
    expect(r.status).toBe(400);
  });

  it("pausada some da leitura do piloto e continua na do dono", async () => {
    const {json} = await criar();
    await chamar("PATCH", `/locais/posto/ofertas/${json.id}`, "dono", {ativa: false});
    const piloto = await chamar("GET", "/locais/posto/ofertas", "rafa");
    expect(piloto.json).toEqual([]);
    const dono = await chamar("GET", "/locais/posto/ofertas", "dono");
    expect(dono.json).toHaveLength(1);
    expect(dono.json[0]).toMatchObject({ativa: false, vigente: false, codigo: "MOTO10"});
  });

  it("piloto vê a ativa fora da janela sem código", async () => {
    await criar({horaInicio: "18:00", horaFim: "20:00"});
    const piloto = await chamar("GET", "/locais/posto/ofertas", "rafa");
    expect(piloto.json[0]).toMatchObject({vigente: false, codigo: null});
  });

  it("DELETE apaga e mantém os cupons", async () => {
    const {json} = await criar();
    await chamar("POST", `/locais/posto/ofertas/${json.id}/cupom`, "rafa");
    const r = await chamar("DELETE", `/locais/posto/ofertas/${json.id}`, "dono");
    expect(r.status).toBe(204);
    expect(banco.ofertas.size).toBe(0);
    expect(banco.cupons.size).toBe(1);
  });
});

describe("VP3 — dono", () => {
  it("admin vincula, repete e solta; soltar pausa as ofertas", async () => {
    const vinculo = await chamar("PUT", "/locais/bar/dono", "admin", {uid: "rafa"});
    expect(vinculo.status).toBe(200);
    expect(vinculo.json).toEqual({donoId: "rafa"});
    expect((await chamar("PUT", "/locais/bar/dono", "admin", {uid: "rafa"})).status).toBe(200);

    await criar({}, "rafa", "bar");
    const solto = await chamar("PUT", "/locais/bar/dono", "admin", {uid: null});
    expect(solto.json).toEqual({donoId: null});
    expect([...banco.ofertas.values()].every((o) => !o.ativa)).toBe(true);
    expect((await criar({codigo: "OUTRO1"}, "rafa", "bar")).status).toBe(403);
  });

  it("trocar o dono não pausa as ofertas", async () => {
    await criar();
    await chamar("PUT", "/locais/posto/dono", "admin", {uid: "rafa"});
    expect([...banco.ofertas.values()][0].ativa).toBe(true);
  });

  it("piloto não vincula", async () => {
    const r = await chamar("PUT", "/locais/bar/dono", "rafa", {uid: "rafa"});
    expect(r.status).toBe(403);
    expect(r.json.erro).toBe("Sem permissão");
  });

  it("valida body, local e piloto", async () => {
    expect((await chamar("PUT", "/locais/bar/dono", "admin", {})).json.erro)
      .toBe("uid é obrigatório");
    expect((await chamar("PUT", "/locais/nada/dono", "admin", {uid: "rafa"})).json.erro)
      .toBe("Local não encontrado");
    expect((await chamar("PUT", "/locais/bar/dono", "admin", {uid: "fantasma"})).json.erro)
      .toBe("Piloto não encontrado");
    expect((await chamar("PUT", "/locais/bar/dono", null, {uid: "rafa"})).status).toBe(401);
  });

  it("GET /perfil lista os pontos do dono por nome", async () => {
    banco.locais.set("bar", {...(banco.locais.get("bar") as LocalMem), donoId: "dono"});
    const dono = await chamar("GET", "/perfil", "dono");
    expect(dono.json.locaisComoDono).toEqual([
      {id: "bar", nome: "Bar da Serra"},
      {id: "posto", nome: "Posto Estrela"},
    ]);
    expect((await chamar("GET", "/perfil", "rafa")).json.locaisComoDono).toEqual([]);
  });

  it("apagar a conta solta o local e pausa as ofertas", async () => {
    await criar();
    const r = await chamar("DELETE", "/perfil", "dono");
    expect(r.status).toBe(204);
    expect(banco.locais.get("posto")?.donoId).toBeNull();
    expect([...banco.ofertas.values()][0].ativa).toBe(false);
  });
});

describe("VP4 — leitura", () => {
  it("GET /locais traz ofertaVigente sem código e mantém a ordem por distância", async () => {
    await criar({titulo: "Antiga", codigo: "ANTIGA1"});
    await criar({titulo: "Nova", codigo: "NOVA01"});
    const r = await chamar("GET", "/locais?lat=-27.02&lng=-48", "rafa");
    expect(r.status).toBe(200);
    expect(r.json.map((l: Json) => l.id)).toEqual(["bar", "posto"]);
    const posto = r.json.find((l: Json) => l.id === "posto") as Json;
    expect(posto.ofertaVigente).toMatchObject({titulo: "Nova", rotulo: "R$ 32", tetoDia: 20});
    expect(posto.ofertaVigente).not.toHaveProperty("codigo");
    expect(r.json.find((l: Json) => l.id === "bar")?.ofertaVigente).toBeNull();
    expect(posto).not.toHaveProperty("donoId");
  });

  it("fora da janela o campo é null", async () => {
    await criar({dias: [1], horaInicio: "08:00", horaFim: "10:00"});
    const r = await chamar("GET", "/locais", "rafa");
    expect(r.json.find((l: Json) => l.id === "posto")?.ofertaVigente).toBeNull();
  });

  it("detalhe de admin traz dono; o do piloto não tem a chave", async () => {
    await criar();
    const admin = await chamar("GET", "/locais/posto", "admin");
    expect(admin.json).toMatchObject({souDono: false, dono: {uid: "dono", nome: "ze"}});
    expect(admin.json.ofertaVigente).toMatchObject({titulo: "Combo do piloto"});

    const semDono = await chamar("GET", "/locais/bar", "admin");
    expect(semDono.json.dono).toBeNull();

    const piloto = await chamar("GET", "/locais/posto", "rafa");
    expect(piloto.json.souDono).toBe(false);
    expect(piloto.json).not.toHaveProperty("dono");
    expect(piloto.json).not.toHaveProperty("donoId");

    expect((await chamar("GET", "/locais/posto", "dono")).json.souDono).toBe(true);
  });
});

describe("VP5 — cupom e balcão", () => {
  it("POST vigente grava um doc e devolve código, nome e moto", async () => {
    const {json} = await criar();
    const r = await chamar("POST", `/locais/posto/ofertas/${json.id}/cupom`, "rafa");
    expect(r.status).toBe(200);
    expect(r.json).toMatchObject({
      codigo: "MOTO10",
      rotulo: "R$ 32",
      piloto: {nome: "Rafael", moto: "CB 500"},
      novo: true,
    });
    expect(banco.cupons.size).toBe(1);
  });

  it("o segundo POST no mesmo dia responde novo: false e não duplica", async () => {
    const {json} = await criar();
    await chamar("POST", `/locais/posto/ofertas/${json.id}/cupom`, "rafa");
    const r = await chamar("POST", `/locais/posto/ofertas/${json.id}/cupom`, "rafa");
    expect(r.json.novo).toBe(false);
    expect(banco.cupons.size).toBe(1);
  });

  it("moto vazia vem como string vazia", async () => {
    const {json} = await criar();
    const r = await chamar("POST", `/locais/posto/ofertas/${json.id}/cupom`, "admin");
    expect(r.json.piloto).toEqual({nome: "Ana", moto: ""});
  });

  it("fora da janela: 409 e nenhum doc", async () => {
    const {json} = await criar({horaInicio: "18:00", horaFim: "20:00"});
    const r = await chamar("POST", `/locais/posto/ofertas/${json.id}/cupom`, "rafa");
    expect(r.status).toBe(409);
    expect(r.json.erro).toBe("Essa oferta não está no ar agora");
    expect(banco.cupons.size).toBe(0);
  });

  it("pausada ou inexistente: 404", async () => {
    const {json} = await criar();
    await chamar("PATCH", `/locais/posto/ofertas/${json.id}`, "dono", {ativa: false});
    expect((await chamar("POST", `/locais/posto/ofertas/${json.id}/cupom`, "rafa")).status)
      .toBe(404);
    expect((await chamar("POST", "/locais/posto/ofertas/nada/cupom", "rafa")).status).toBe(404);
    expect((await chamar("POST", "/locais/nada/ofertas/x/cupom", "rafa")).json.erro)
      .toBe("Local não encontrado");
  });

  it("balcão conta cupons e check-ins desde segunda; piloto recebe 403", async () => {
    const {json} = await criar();
    await chamar("POST", `/locais/posto/ofertas/${json.id}/cupom`, "rafa");
    await chamar("POST", `/locais/posto/ofertas/${json.id}/cupom`, "admin");
    banco.cupons.set("velho", {localId: "posto", createdAt: Date.parse("2026-11-08T12:00:00Z")});
    banco.checkins.push(
      {localId: "posto", createdAt: Date.parse("2026-11-10T12:00:00Z")},
      {localId: "posto", createdAt: Date.parse("2026-11-09T02:59:00Z")},
      {localId: "bar", createdAt: Date.parse("2026-11-10T12:00:00Z")},
    );
    const r = await chamar("GET", "/locais/posto/balcao", "dono");
    expect(r.status).toBe(200);
    expect(r.json).toMatchObject({
      local: {id: "posto", nome: "Posto Estrela"},
      semana: {cuponsAbertos: 2, checkins: 1},
    });
    expect((r.json.ofertas as Json[])[0].codigo).toBe("MOTO10");
    expect((await chamar("GET", "/locais/posto/balcao", "rafa")).status).toBe(403);
    expect((await chamar("GET", "/locais/posto/balcao", "admin")).status).toBe(200);
  });
});
