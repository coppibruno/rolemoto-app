import type {AddressInfo} from "node:net";
import type {Server} from "node:http";
import express from "express";
import type {NextFunction, Request, Response} from "express";
import {afterAll, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import type {
  Conquista,
  ConquistaCreate,
  ConquistaUpdate,
  PassagemNova,
  UsuarioConquista,
} from "../types/conquista";
import type {RoleTelemetriaNovo} from "../types/role-telemetria";

const banco = vi.hoisted(() => ({
  conquistas: new Map<string, Conquista>(),
  carimbos: new Map<string, UsuarioConquista>(),
  usuarios: new Map<string, {admin: boolean}>(),
  falharConcessao: false,
  falharLimpeza: false,
  relogio: 0,
}));

const agoraIso = (): string => {
  banco.relogio += 1000;
  return new Date(Date.UTC(2026, 10, 11) + banco.relogio).toISOString();
};

vi.mock("../lib/log", () => ({
  log: {info: vi.fn(), warn: vi.fn(), error: vi.fn()},
  erroDe: (e: unknown) => ({detalhe: String(e)}),
}));

vi.mock("../lib/firebase-admin", () => ({
  adminAuth: {deleteUser: vi.fn(async () => undefined)},
  firestore: {},
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

vi.mock("../lib/checkin-local", () => ({
  hidratarSelosSeVazio: async (_uid: string, selos: unknown[]) => selos,
}));

vi.mock("../lib/story-local", () => ({
  apagarStoriesDoUsuario: async () => undefined,
}));

vi.mock("../repositories", () => {
  const conquistaRepository = {
    listar: async () => [...banco.conquistas.values()],
    buscarPorId: async (id: string) => banco.conquistas.get(id) ?? null,
    criar: async (dados: ConquistaCreate) => {
      const c: Conquista = {
        id: `auto-${banco.conquistas.size + 1}`,
        ...dados,
        ativa: true,
        createdAt: agoraIso(),
        updatedAt: agoraIso(),
      };
      banco.conquistas.set(c.id, c);
      return c;
    },
    criarSeAusente: async (id: string, dados: ConquistaCreate) => {
      if (banco.conquistas.has(id)) return false;
      banco.conquistas.set(id, {
        id,
        ...dados,
        ativa: true,
        createdAt: agoraIso(),
        updatedAt: agoraIso(),
      });
      return true;
    },
    atualizar: async (id: string, dados: ConquistaUpdate) => {
      const atual = banco.conquistas.get(id);
      if (!atual) return null;
      const proximo = {...atual, ...dados, updatedAt: agoraIso()};
      banco.conquistas.set(id, proximo);
      return proximo;
    },
    registrarPassagem: async (p: PassagemNova) => {
      if (banco.falharConcessao) throw new Error("forçada");
      const id = `${p.usuarioId}_${p.conquistaId}`;
      const atual = banco.carimbos.get(id);
      const agora = agoraIso();
      if (!atual) {
        banco.carimbos.set(id, {
          id,
          ...p,
          primeiraVezEm: agora,
          recordeEm: agora,
          createdAt: agora,
          updatedAt: agora,
        });
        return "primeira";
      }
      if (p.velocidadeMaxKmh <= atual.velocidadeMaxKmh) return null;
      banco.carimbos.set(id, {
        ...atual,
        velocidadeMaxKmh: p.velocidadeMaxKmh,
        telemetriaId: p.telemetriaId,
        recordeEm: agora,
        updatedAt: agora,
      });
      return "recorde";
    },
    listarPorUsuario: async (uid: string) =>
      [...banco.carimbos.values()]
        .filter((c) => c.usuarioId === uid)
        .sort((a, b) => a.primeiraVezEm.localeCompare(b.primeiraVezEm)),
    limparPorUsuario: async (uid: string) => {
      if (banco.falharLimpeza) throw new Error("forçada");
      for (const [id, c] of banco.carimbos) {
        if (c.usuarioId === uid) banco.carimbos.delete(id);
      }
    },
  };
  let telemetrias = 0;
  const usuario = (uid: string) => ({
    uid,
    nome: "Piloto Teste",
    apelido: "teste",
    moto: "XRE",
    tipoMoto: null,
    pilotagem: "moderada",
    fotoUrl: "",
    cidade: "",
    garupaFrequente: false,
    admin: banco.usuarios.get(uid)?.admin ?? false,
    locaisVisitadosUnicos: 0,
    selos: [],
    seguindo: 0,
    seguidores: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
  });
  return {
    conquistaRepository,
    roleTelemetriaRepository: {
      criar: async (dados: RoleTelemetriaNovo) => {
        telemetrias += 1;
        return {
          id: `tele-${telemetrias}`,
          ...dados,
          createdAt: agoraIso(),
          updatedAt: agoraIso(),
        };
      },
    },
    telemetriaSessaoRepository: {},
    usuarioRepository: {
      buscarPorId: async (uid: string) =>
        banco.usuarios.has(uid) ? usuario(uid) : null,
      lerCamposBusca: async () => null,
      remover: async (uid: string) => {
        banco.usuarios.delete(uid);
      },
    },
    seguirRepository: {
      vinculosCom: async () => new Map(),
      limparPorUsuario: async () => undefined,
    },
    dispositivoRepository: {removerPorUid: async () => undefined},
    conviteEventoRepository: {limparPorUsuario: async () => undefined},
    roleRepository: {},
    usuarioRoleRepository: {},
    historicoOcultoRepository: {},
  };
});

const {conquistasRouter} = await import("./conquistas");
const {telemetriaRouter} = await import("./telemetria");
const {perfilRouter} = await import("./perfil");
const {usuariosRouter} = await import("./usuarios");
const {codificarPolyline} = await import("../lib/tracado");

let server: Server;
let base = "";

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use("/conquistas", conquistasRouter);
  app.use("/telemetria", telemetriaRouter);
  app.use("/perfil", perfilRouter);
  app.use("/usuarios", usuariosRouter);
  server = app.listen(0);
  await new Promise((ok) => server.once("listening", ok));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
});

beforeEach(() => {
  banco.conquistas.clear();
  banco.carimbos.clear();
  banco.usuarios.clear();
  banco.usuarios.set("admin1", {admin: true});
  banco.usuarios.set("piloto", {admin: false});
  banco.falharConcessao = false;
  banco.falharLimpeza = false;
});

const chamar = async (
  metodo: string,
  caminho: string,
  uid: string | null,
  body?: unknown,
): Promise<{status: number; json: Record<string, unknown>}> => {
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

const itens = (json: Record<string, unknown>) =>
  json.itens as Record<string, unknown>[];

const sul = {lat: -27.6, lng: -48.6};

describe("CQ2 — catálogo", () => {
  it("GET /admin na base vazia cria os três pontos e não os recria", async () => {
    const primeira = await chamar("GET", "/conquistas/admin", "admin1");
    expect(primeira.status).toBe(200);
    expect(itens(primeira.json).map((i) => i.id).sort()).toEqual([
      "morro-da-igreja",
      "serra-corvo-branco",
      "serra-rio-do-rastro",
    ]);
    await chamar("PATCH", "/conquistas/morro-da-igreja", "admin1", {lat: -28.13});
    const segunda = await chamar("GET", "/conquistas/admin", "admin1");
    expect(itens(segunda.json)).toHaveLength(3);
    const morro = itens(segunda.json).find((i) => i.id === "morro-da-igreja");
    expect(morro?.lat).toBe(-28.13);
  });

  it("GET / do piloto devolve só ativas, sem ativa e sem criadorId", async () => {
    await chamar("GET", "/conquistas/admin", "admin1");
    const res = await chamar("GET", "/conquistas", "piloto");
    expect(res.status).toBe(200);
    expect(itens(res.json)).toHaveLength(3);
    for (const item of itens(res.json)) {
      expect(Object.keys(item).sort()).toEqual(["id", "lat", "lng", "nome", "raioMetros"]);
    }
    expect(itens(res.json).map((i) => i.nome)).toEqual([
      "Morro da Igreja",
      "Serra do Corvo Branco",
      "Serra do Rio do Rastro",
    ]);
  });

  it("piloto comum não roda seed nem cria", async () => {
    expect((await chamar("GET", "/conquistas/admin", "piloto")).status).toBe(403);
    const post = await chamar("POST", "/conquistas", "piloto", {
      nome: "Mirante",
      ...sul,
      raioMetros: 500,
    });
    expect(post.status).toBe(403);
    expect(post.json.erro).toBe("Apenas administradores");
    expect(banco.conquistas.size).toBe(0);
  });

  it("sem token responde 401", async () => {
    expect((await chamar("GET", "/conquistas", null)).status).toBe(401);
  });

  it("POST válido responde 201 com o item admin", async () => {
    const res = await chamar("POST", "/conquistas", "admin1", {
      nome: "  Serra   do Faxinal ",
      ...sul,
      raioMetros: 650,
    });
    expect(res.status).toBe(201);
    expect(res.json).toEqual({
      id: "auto-1",
      nome: "Serra do Faxinal",
      ...sul,
      raioMetros: 650,
      ativa: true,
    });
    expect(banco.conquistas.get("auto-1")?.criadorId).toBe("admin1");
  });

  it("nome repetido, raio 100, raio 2050 e pino fora do Sul são recusados", async () => {
    await chamar("GET", "/conquistas/admin", "admin1");
    const casos: [Record<string, unknown>, number][] = [
      [{nome: "morro da IGREJA", ...sul, raioMetros: 500}, 409],
      [{nome: "Ponto A", ...sul, raioMetros: 100}, 400],
      [{nome: "Ponto A", ...sul, raioMetros: 2050}, 400],
      [{nome: "Ponto A", ...sul, raioMetros: 525}, 400],
      [{nome: "Ponto A", lat: -23.55, lng: -46.63, raioMetros: 500}, 400],
      [{nome: "PA", ...sul, raioMetros: 500}, 400],
    ];
    for (const [body, status] of casos) {
      const res = await chamar("POST", "/conquistas", "admin1", body);
      expect(res.status, JSON.stringify(body)).toBe(status);
    }
    const fora = await chamar("POST", "/conquistas", "admin1", {
      nome: "Paulista",
      lat: -23.55,
      lng: -46.63,
      raioMetros: 500,
    });
    expect(fora.json.erro).toBe("Só cadastramos pontos em SC, PR e RS");
  });

  it("PATCH move pino e raio; ativa false tira do piloto e mantém no admin", async () => {
    await chamar("GET", "/conquistas/admin", "admin1");
    const movida = await chamar("PATCH", "/conquistas/serra-corvo-branco", "admin1", {
      lat: -28.06,
      lng: -49.37,
      raioMetros: 800,
    });
    expect(movida.status).toBe(200);
    expect(movida.json).toMatchObject({lat: -28.06, lng: -49.37, raioMetros: 800});

    const arquivada = await chamar("PATCH", "/conquistas/serra-corvo-branco", "admin1", {
      ativa: false,
    });
    expect(arquivada.json.ativa).toBe(false);
    const piloto = await chamar("GET", "/conquistas", "piloto");
    expect(itens(piloto.json).map((i) => i.id)).not.toContain("serra-corvo-branco");
    const admin = await chamar("GET", "/conquistas/admin", "admin1");
    expect(itens(admin.json).find((i) => i.id === "serra-corvo-branco")?.ativa).toBe(false);
  });

  it("PATCH: 404, 409 com outro doc, 400 fora do Sul", async () => {
    await chamar("GET", "/conquistas/admin", "admin1");
    expect((await chamar("PATCH", "/conquistas/nada", "admin1", {ativa: true})).status)
      .toBe(404);
    expect((await chamar("PATCH", "/conquistas/morro-da-igreja", "admin1", {
      nome: "Serra do Rio do Rastro",
    })).status).toBe(409);
    expect((await chamar("PATCH", "/conquistas/morro-da-igreja", "admin1", {
      nome: "Morro da Igreja",
    })).status).toBe(200);
    expect((await chamar("PATCH", "/conquistas/morro-da-igreja", "admin1", {
      lng: -46,
    })).status).toBe(400);
  });

  it("não existe rota de delete", async () => {
    await chamar("GET", "/conquistas/admin", "admin1");
    const res = await chamar("DELETE", "/conquistas/morro-da-igreja", "admin1");
    expect(res.status).toBe(404);
    expect(banco.conquistas.has("morro-da-igreja")).toBe(true);
  });
});

const METROS_POR_GRAU = (6371 * 1000 * Math.PI) / 180;
const rastro = {lat: -28.399, lng: -49.5478};
const inicio = Date.parse("2026-11-11T13:00:00.000Z");

const passagem = (speedMs: number, inicioMs = inicio + 60_000) =>
  Array.from({length: 6}, (_, i) => ({
    lat: rastro.lat + (i * 2 * speedMs) / METROS_POR_GRAU,
    lng: rastro.lng,
    t: inicioMs + i * 2000,
    speed: speedMs,
    accuracy: 5,
    provider: "gps",
  }));

const bodyPasseio = (amostras?: unknown, tracadoOk = true) => ({
  velocidadeMaxKmh: 60,
  velocidadeMediaKmh: 40,
  distanciaKm: 12,
  tempoSegundos: 1800,
  tempoMovimentoSegundos: 1500,
  iniciadoEm: new Date(inicio).toISOString(),
  encerradoEm: new Date(inicio + 1_800_000).toISOString(),
  pontoInicio: {lat: rastro.lat - 0.05, lng: rastro.lng, nome: "", endereco: ""},
  pontoFim: {lat: rastro.lat + 0.05, lng: rastro.lng, nome: "", endereco: ""},
  tracado: tracadoOk ?
    codificarPolyline([
      {lat: rastro.lat - 0.05, lng: rastro.lng},
      {lat: rastro.lat + 0.05, lng: rastro.lng},
    ]) :
    "",
  ...(amostras === undefined ? {} : {amostras}),
});

const amostraRastro = (speedMs: number) => [
  {conquistaId: "serra-rio-do-rastro", pontos: passagem(speedMs)},
];

describe("CQ3 — concessão no POST /telemetria", () => {
  beforeEach(async () => {
    await chamar("GET", "/conquistas/admin", "admin1");
  });

  it("sem amostras responde 201 como hoje, com conquistas []", async () => {
    const res = await chamar("POST", "/telemetria", "piloto", bodyPasseio());
    expect(res.status).toBe(201);
    expect(res.json.id).toBe("tele-1");
    expect(res.json.conquistas).toEqual([]);
  });

  it("primeira passagem cria o carimbo com uma casa", async () => {
    const res = await chamar("POST", "/telemetria", "piloto", bodyPasseio(amostraRastro(10)));
    expect(res.status).toBe(201);
    expect(res.json.conquistas).toEqual([{
      id: "serra-rio-do-rastro",
      nome: "Serra do Rio do Rastro",
      velocidadeMaxKmh: 36,
      novidade: "primeira",
    }]);
    const doc = banco.carimbos.get("piloto_serra-rio-do-rastro");
    expect(doc).toMatchObject({velocidadeMaxKmh: 36, telemetriaId: res.json.id});
    expect(doc?.primeiraVezEm).toBe(doc?.recordeEm);
  });

  it("passagem mais rápida sobe o recorde; igual ou mais lenta não escreve", async () => {
    await chamar("POST", "/telemetria", "piloto", bodyPasseio(amostraRastro(10)));
    const primeira = {...banco.carimbos.get("piloto_serra-rio-do-rastro")};

    const recorde = await chamar("POST", "/telemetria", "piloto", bodyPasseio(amostraRastro(11)));
    expect(recorde.json.conquistas).toEqual([
      expect.objectContaining({novidade: "recorde", velocidadeMaxKmh: 39.6}),
    ]);
    const depois = banco.carimbos.get("piloto_serra-rio-do-rastro");
    expect(depois?.primeiraVezEm).toBe(primeira.primeiraVezEm);
    expect(depois?.recordeEm).not.toBe(primeira.recordeEm);
    expect(depois?.telemetriaId).toBe(recorde.json.id);

    const congelado = {...depois};
    for (const speed of [11, 10]) {
      const res = await chamar("POST", "/telemetria", "piloto", bodyPasseio(amostraRastro(speed)));
      expect(res.status).toBe(201);
      expect(res.json.conquistas).toEqual([]);
    }
    expect(banco.carimbos.get("piloto_serra-rio-do-rastro")).toEqual(congelado);
  });

  it("arquivada, id inventado ou traçado vazio não criam doc", async () => {
    await chamar("PATCH", "/conquistas/serra-rio-do-rastro", "admin1", {ativa: false});
    await chamar("POST", "/telemetria", "piloto", bodyPasseio(amostraRastro(10)));
    await chamar("PATCH", "/conquistas/serra-rio-do-rastro", "admin1", {ativa: true});
    await chamar("POST", "/telemetria", "piloto", bodyPasseio([
      {conquistaId: "inventada", pontos: passagem(10)},
    ]));
    await chamar("POST", "/telemetria", "piloto", bodyPasseio(amostraRastro(10), false));
    expect(banco.carimbos.size).toBe(0);
  });

  it("amostras com tipo errado não derrubam o 201", async () => {
    const lixos = [
      "texto",
      42,
      {conquistaId: "serra-rio-do-rastro"},
      [null, 3, "x", {conquistaId: 9, pontos: []}],
      [{conquistaId: "serra-rio-do-rastro", pontos: [{lat: "a", lng: 1, t: "b"}]}],
    ];
    for (const amostras of lixos) {
      const res = await chamar("POST", "/telemetria", "piloto", bodyPasseio(amostras));
      expect(res.status).toBe(201);
      expect(res.json.conquistas).toEqual([]);
    }
  });

  it("exceção forçada na concessão devolve 201 e conquistas []", async () => {
    banco.falharConcessao = true;
    const res = await chamar("POST", "/telemetria", "piloto", bodyPasseio(amostraRastro(10)));
    expect(res.status).toBe(201);
    expect(res.json.id).toBeTruthy();
    expect(res.json.conquistas).toEqual([]);
  });

  it("body do passeio inválido continua 400", async () => {
    const res = await chamar("POST", "/telemetria", "piloto", {
      ...bodyPasseio(amostraRastro(10)),
      distanciaKm: -1,
    });
    expect(res.status).toBe(400);
  });
});

describe("CQ4 — perfil e conta", () => {
  beforeEach(async () => {
    await chamar("GET", "/conquistas/admin", "admin1");
    await chamar("POST", "/telemetria", "piloto", bodyPasseio(amostraRastro(10)));
  });

  it("GET /perfil traz a velocidade; GET /usuarios/:uid não, nem para o próprio uid", async () => {
    const proprio = await chamar("GET", "/perfil", "piloto");
    expect(proprio.json.conquistas).toEqual([
      {id: "serra-rio-do-rastro", nome: "Serra do Rio do Rastro", velocidadeMaxKmh: 36},
    ]);
    for (const quem of ["piloto", "admin1"]) {
      const publico = await chamar("GET", "/usuarios/piloto", quem);
      expect(publico.json.conquistas).toEqual([
        {id: "serra-rio-do-rastro", nome: "Serra do Rio do Rastro"},
      ]);
    }
  });

  it("renomear acompanha; arquivar mantém o carimbo; sumida sai", async () => {
    await chamar("PATCH", "/conquistas/serra-rio-do-rastro", "admin1", {
      nome: "Rio do Rastro",
      ativa: false,
    });
    const proprio = await chamar("GET", "/perfil", "piloto");
    expect((proprio.json.conquistas as {nome: string}[])[0]?.nome).toBe("Rio do Rastro");
    const publico = await chamar("GET", "/usuarios/piloto", "admin1");
    expect((publico.json.conquistas as {nome: string}[])[0]?.nome).toBe("Rio do Rastro");

    banco.conquistas.delete("serra-rio-do-rastro");
    expect((await chamar("GET", "/perfil", "piloto")).json.conquistas).toEqual([]);
  });

  it("ordem é primeiraVezEm crescente", async () => {
    await chamar("POST", "/telemetria", "piloto", {
      ...bodyPasseio(),
      amostras: [{
        conquistaId: "morro-da-igreja",
        pontos: passagem(10).map((p) => ({
          ...p,
          lat: p.lat - rastro.lat + -28.1258,
          lng: -49.4808,
        })),
      }],
      tracado: codificarPolyline([
        {lat: -28.2, lng: -49.4808},
        {lat: -28.0, lng: -49.4808},
      ]),
    });
    const proprio = await chamar("GET", "/perfil", "piloto");
    expect((proprio.json.conquistas as {id: string}[]).map((c) => c.id)).toEqual([
      "serra-rio-do-rastro",
      "morro-da-igreja",
    ]);
  });

  it("DELETE /perfil apaga os carimbos; falha na limpeza ainda dá 204", async () => {
    const res = await chamar("DELETE", "/perfil", "piloto");
    expect(res.status).toBe(204);
    expect(banco.carimbos.size).toBe(0);
    expect(banco.conquistas.size).toBe(3);

    banco.usuarios.set("piloto", {admin: false});
    await chamar("POST", "/telemetria", "piloto", bodyPasseio(amostraRastro(10)));
    banco.falharLimpeza = true;
    expect((await chamar("DELETE", "/perfil", "piloto")).status).toBe(204);
  });
});
