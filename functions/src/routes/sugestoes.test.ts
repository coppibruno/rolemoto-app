import type {AddressInfo} from "node:net";
import type {Server} from "node:http";
import express from "express";
import type {NextFunction, Request, Response} from "express";
import {afterAll, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import {haversineKm} from "../lib/geo";
import {instanteDispensa} from "../lib/sugestao-piloto";
import type {Usuario} from "../types/usuario";
import type {
  FotoJanela,
  PontoCatalogo,
  PontoEvento,
  RoleJanela,
  StoryJanela,
  TelemetriaJanela,
} from "../repositories/interfaces/sugestao.repository";

type Dispensa = {
  id: string;
  usuarioId: string;
  dispensadoId: string;
  ate: string;
};

const banco = vi.hoisted(() => ({
  usuarios: new Map<string, Usuario>(),
  seguindo: new Map<string, string[]>(),
  seguidores: new Map<string, string[]>(),
  dispensas: new Map<string, Dispensa>(),
  roles: [] as RoleJanela[],
  telemetrias: [] as TelemetriaJanela[],
  stories: [] as StoryJanela[],
  fotos: [] as FotoJanela[],
  locais: [] as PontoCatalogo[],
  eventos: [] as PontoEvento[],
  falharLimpeza: false,
  falharFaixa: "" as string,
  geoLeituras: 0,
}));

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
  apagarStoryPerfil: async () => undefined,
  contarStoriesUsuario: async () => 0,
  listarStoriesUsuario: async () => [],
  marcarVistoPerfil: async () => undefined,
}));

vi.mock("../lib/notificacoes", () => ({
  notificarNovoSeguidor: async () => undefined,
}));

vi.mock("../lib/post-foto-publico", () => ({
  apagarPostsDoUsuario: async () => undefined,
  paraItemGrade: (post: unknown) => post,
}));

vi.mock("../lib/conquistas", () => ({
  conquistasDoPerfil: async () => [],
  conquistasPublicas: async () => [],
  semFalhar: async () => [],
}));

vi.mock("../lib/dono-local", () => ({
  soltarLocaisDoUsuario: async () => undefined,
}));

vi.mock("../lib/roles-fixados", () => ({
  rolesFixadosDe: async () => [],
}));

vi.mock("../lib/afiliado", () => ({
  codigoAfiliado: () => null,
  vincularAfiliado: async () => undefined,
}));

vi.mock("../repositories", () => ({
  usuarioRepository: {
    buscarPorId: async (uid: string) => banco.usuarios.get(uid) ?? null,
    buscarPorIds: async (uids: string[]) =>
      uids.flatMap((uid) => {
        const pessoa = banco.usuarios.get(uid);
        return pessoa ? [pessoa] : [];
      }),
    lerCamposBusca: async () => null,
    remover: async (uid: string) => {
      banco.usuarios.delete(uid);
    },
  },
  seguirRepository: {
    listarSeguidores: async (uid: string) => ({
      ok: true as const,
      proximoCursor: null,
      vinculos: (banco.seguidores.get(uid) ?? []).map((seguidorId) => ({
        id: `${seguidorId}_${uid}`,
        seguidorId,
        seguidoId: uid,
        createdAt: "2026-11-01T00:00:00.000Z",
      })),
    }),
    listarSeguidosRecentes: async (uid: string, limite: number) =>
      (banco.seguindo.get(uid) ?? []).slice(0, limite),
    vinculosCom: async (token: string, uids: string[]) => {
      const sigo = new Set(banco.seguindo.get(token) ?? []);
      const meSeguem = new Set(banco.seguidores.get(token) ?? []);
      const mapa = new Map<string, {seguidoPorMim: boolean; segueVoce: boolean}>();
      for (const id of uids) {
        mapa.set(id, {seguidoPorMim: sigo.has(id), segueVoce: meSeguem.has(id)});
      }
      return mapa;
    },
    limparPorUsuario: async () => undefined,
  },
  sugestaoRepository: {
    dispensar: async (usuarioId: string, dispensadoId: string) => {
      const id = `${usuarioId}_${dispensadoId}`;
      const ate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      banco.dispensas.set(id, {id, usuarioId, dispensadoId, ate});
    },
    listarDispensadosVigentes: async (usuarioId: string, agora: Date) =>
      [...banco.dispensas.values()]
        .filter((doc) =>
          doc.usuarioId === usuarioId &&
          Date.parse(doc.ate) > agora.getTime(),
        )
        .slice(0, 100)
        .map((doc) => doc.dispensadoId),
    limparPorUsuario: async (uid: string) => {
      if (banco.falharLimpeza) {
        throw new Error("forçada");
      }
      for (const [id, doc] of banco.dispensas) {
        if (doc.usuarioId === uid || doc.dispensadoId === uid) {
          banco.dispensas.delete(id);
        }
      }
    },
    listarRolesJanela: async () => {
      banco.geoLeituras += 1;
      if (banco.falharFaixa === "organizou_role") {
        throw new Error("forçada");
      }
      return banco.roles;
    },
    listarTelemetriasRecentes: async () => {
      banco.geoLeituras += 1;
      if (banco.falharFaixa === "telemetria") {
        throw new Error("forçada");
      }
      return banco.telemetrias;
    },
    listarStoriesVivas: async () => {
      banco.geoLeituras += 1;
      if (banco.falharFaixa === "stories") {
        throw new Error("forçada");
      }
      return banco.stories;
    },
    listarFotosRecentes: async () => {
      banco.geoLeituras += 1;
      if (banco.falharFaixa === "fotos") {
        throw new Error("forçada");
      }
      return banco.fotos;
    },
    listarLocais: async (ids: string[]) => {
      const pedidos = new Set(ids);
      return banco.locais.filter((local) => pedidos.has(local.id)).slice(0, 40);
    },
    listarEventos: async (ids: string[]) => {
      const pedidos = new Set(ids);
      return banco.eventos.filter((evento) => pedidos.has(evento.id)).slice(0, 40);
    },
  },
  dispositivoRepository: {removerPorUid: async () => undefined},
  atividadeRepository: {limparPorUsuario: async () => undefined},
  conviteEventoRepository: {limparPorUsuario: async () => undefined},
  conversaRepository: {limparPorUsuario: async () => undefined},
  conquistaRepository: {limparPorUsuario: async () => undefined},
  postFotoRepository: {},
  roleTelemetriaRepository: {listarPorUsuario: async () => []},
  roleRepository: {},
  usuarioRoleRepository: {},
  historicoOcultoRepository: {},
  localRepository: {},
}));

const {usuariosRouter} = await import("./usuarios");
const {perfilRouter} = await import("./perfil");
const {log} = await import("../lib/log");

const BLU = {lat: -26.9189, lng: -49.0661};
const norte = (km: number) => BLU.lat + km / 111.195;

const pessoa = (uid: string, apelido = uid): Usuario => ({
  uid,
  nome: apelido,
  apelido,
  moto: "XRE",
  tipoMoto: null,
  pilotagem: "moderada",
  fotoUrl: "",
  cidade: "",
  garupaFrequente: false,
  admin: false,
  locaisVisitadosUnicos: 0,
  selos: [],
  seguindo: 0,
  seguidores: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
});

let server: Server;
let base = "";

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use("/usuarios", usuariosRouter);
  app.use("/perfil", perfilRouter);
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
});

beforeEach(() => {
  banco.usuarios.clear();
  banco.seguindo.clear();
  banco.seguidores.clear();
  banco.dispensas.clear();
  banco.roles = [];
  banco.telemetrias = [];
  banco.stories = [];
  banco.fotos = [];
  banco.locais = [];
  banco.eventos = [];
  banco.falharLimpeza = false;
  banco.falharFaixa = "";
  banco.geoLeituras = 0;
  banco.usuarios.set("ana", pessoa("ana", "Ana"));
  vi.mocked(log.warn).mockClear();
});

const chamar = async (
  metodo: string,
  caminho: string,
  uid: string | null = "ana",
) => {
  const headers: Record<string, string> = {};
  if (uid) {
    headers["x-uid"] = uid;
  }
  const res = await fetch(`${base}${caminho}`, {method: metodo, headers});
  const texto = await res.text();
  return {status: res.status, json: texto ? JSON.parse(texto) : null};
};

describe("dispensa — CG2", () => {
  it("grava o par por 30 dias, atualiza no repetido e recusa eu mesmo ou ausente", async () => {
    banco.usuarios.set("bia", pessoa("bia", "Bia"));
    const criado = await chamar("POST", "/usuarios/sugestoes/bia/dispensa");
    expect(criado.status).toBe(204);
    const doc = banco.dispensas.get("ana_bia");
    expect(doc?.id).toBe("ana_bia");
    const ate = Date.parse(doc?.ate ?? "");
    expect(Math.abs(ate - instanteDispensa(new Date()).getTime())).toBeLessThan(5000);

    const deNovo = await chamar("POST", "/usuarios/sugestoes/bia/dispensa");
    expect(deNovo.status).toBe(204);
    expect(banco.dispensas.size).toBe(1);
    expect(banco.dispensas.get("ana_bia")?.ate).not.toBe("");

    expect((await chamar("POST", "/usuarios/sugestoes/ana/dispensa")).status).toBe(400);
    expect((await chamar("POST", "/usuarios/sugestoes/ninguem/dispensa")).status).toBe(404);
    expect((await chamar("POST", "/usuarios/sugestoes/%20/dispensa")).status).toBe(400);
  });

  it("DELETE /perfil apaga os dois lados; falha na limpeza ainda responde 204", async () => {
    banco.usuarios.set("bia", pessoa("bia", "Bia"));
    banco.dispensas.set("ana_bia", {
      id: "ana_bia",
      usuarioId: "ana",
      dispensadoId: "bia",
      ate: instanteDispensa(new Date()).toISOString(),
    });
    banco.dispensas.set("caio_ana", {
      id: "caio_ana",
      usuarioId: "caio",
      dispensadoId: "ana",
      ate: instanteDispensa(new Date()).toISOString(),
    });
    const ok = await chamar("DELETE", "/perfil");
    expect(ok.status).toBe(204);
    expect(banco.dispensas.size).toBe(0);

    banco.falharLimpeza = true;
    banco.usuarios.set("ana", pessoa("ana", "Ana"));
    banco.dispensas.set("ana_bia", {
      id: "ana_bia",
      usuarioId: "ana",
      dispensadoId: "bia",
      ate: instanteDispensa(new Date()).toISOString(),
    });
    const falha = await chamar("DELETE", "/perfil");
    expect(falha.status).toBe(204);
    expect(banco.dispensas.has("ana_bia")).toBe(true);
    expect(log.warn).toHaveBeenCalled();
  });
});

describe("lista — CG3", () => {
  it("a rota não cai em /:uid e sem coordenada só devolve a rede", async () => {
    banco.usuarios.set("bia", pessoa("bia", "Bia"));
    banco.usuarios.set("carol", pessoa("carol", "Carol"));
    banco.usuarios.set("ana", pessoa("ana", "Ana"));
    banco.seguidores.set("ana", ["bia", "ana"]);
    banco.seguindo.set("ana", ["amigo"]);
    banco.usuarios.set("amigo", pessoa("amigo", "Amigo"));
    banco.seguindo.set("amigo", ["carol"]);
    banco.roles.push({
      criadorId: "bia",
      titulo: "Serra",
      lat: norte(40),
      lng: BLU.lng,
      dataHoraSaida: "2026-12-01T12:00:00.000Z",
    });

    const res = await chamar("GET", "/usuarios/sugestoes");
    expect(res.status).toBe(200);
    expect(res.json.erro).toBeUndefined();
    const tipos = (res.json.itens as {uid: string; motivo: {tipo: string}}[])
      .map((item) => item.motivo.tipo);
    expect(tipos.every((tipo) => tipo === "segue_voce" || tipo === "seguido_por")).toBe(true);
    const uids = (res.json.itens as {uid: string}[]).map((item) => item.uid);
    expect(uids).toContain("bia");
    expect(uids).toContain("carol");
    expect(uids).not.toContain("ana");
    expect(uids).not.toContain("amigo");
    expect(banco.geoLeituras).toBe(0);
  });

  it("recusa lat sem lng, corta em 10 e devolve lista vazia", async () => {
    expect((await chamar("GET", "/usuarios/sugestoes?lat=-26.9")).status).toBe(400);
    const vazio = await chamar("GET", "/usuarios/sugestoes");
    expect(vazio.status).toBe(200);
    expect(vazio.json).toEqual({itens: []});

    const ids = Array.from({length: 11}, (_, i) => `f${i}`);
    for (const id of ids) {
      banco.usuarios.set(id, pessoa(id, id));
    }
    banco.seguidores.set("ana", ids);
    const pagina = await chamar("GET", "/usuarios/sugestoes");
    expect(pagina.json.itens).toHaveLength(10);
  });

  it("filtra raio, telemetria privada, foto sem marca e dispensa vencida", async () => {
    const lat40 = norte(40);
    const lat60 = norte(60);
    const km40 = Math.round(haversineKm(BLU.lat, BLU.lng, lat40, BLU.lng));
    expect(km40).toBeLessThanOrEqual(50);
    expect(Math.round(haversineKm(BLU.lat, BLU.lng, lat60, BLU.lng))).toBeGreaterThan(50);

    banco.usuarios.set("org", pessoa("org", "Org"));
    banco.usuarios.set("longe", pessoa("longe", "Longe"));
    banco.usuarios.set("tela", pessoa("tela", "Tela"));
    banco.usuarios.set("secreta", pessoa("secreta", "Secreta"));
    banco.usuarios.set("antiga", pessoa("antiga", "Antiga"));
    banco.usuarios.set("semmarca", pessoa("semmarca", "Sem"));
    banco.usuarios.set("story", pessoa("story", "Story"));
    banco.usuarios.set("oculto", pessoa("oculto", "Oculto"));
    banco.usuarios.set("voltou", pessoa("voltou", "Voltou"));

    banco.roles.push(
      {
        criadorId: "org",
        titulo: "Serra",
        lat: lat40,
        lng: BLU.lng,
        dataHoraSaida: "2026-12-01T12:00:00.000Z",
      },
      {
        criadorId: "longe",
        titulo: "Longe",
        lat: lat60,
        lng: BLU.lng,
        dataHoraSaida: "2026-12-01T13:00:00.000Z",
      },
    );
    banco.telemetrias.push(
      {
        usuarioId: "secreta",
        nome: "Posto",
        lat: lat40,
        lng: BLU.lng,
        publica: false,
        encerradoEm: "2026-11-10T00:00:00.000Z",
      },
      {
        usuarioId: "antiga",
        nome: "",
        lat: lat40,
        lng: BLU.lng,
        publica: true,
        encerradoEm: "2026-11-09T00:00:00.000Z",
      },
      {
        usuarioId: "tela",
        nome: "Mirante",
        lat: lat40,
        lng: BLU.lng,
        publica: true,
        encerradoEm: "2026-11-15T00:00:00.000Z",
      },
    );
    banco.fotos.push({
      usuarioId: "semmarca",
      marcaTipo: null,
      marcaId: null,
      createdAt: "2026-11-15T00:00:00.000Z",
    });
    banco.stories.push({
      usuarioId: "story",
      album: "local",
      localId: "bar",
      eventoId: null,
      localizacaoNome: null,
      localizacaoLat: null,
      localizacaoLng: null,
      createdAt: "2026-11-15T00:00:00.000Z",
    });
    banco.locais.push({id: "bar", nome: "Bar do Moto", lat: lat40, lng: BLU.lng});
    banco.seguidores.set("ana", ["oculto", "voltou"]);
    banco.dispensas.set("ana_oculto", {
      id: "ana_oculto",
      usuarioId: "ana",
      dispensadoId: "oculto",
      ate: instanteDispensa(new Date()).toISOString(),
    });
    banco.dispensas.set("ana_voltou", {
      id: "ana_voltou",
      usuarioId: "ana",
      dispensadoId: "voltou",
      ate: new Date(Date.now() - 86_400_000).toISOString(),
    });

    const res = await chamar(
      "GET",
      `/usuarios/sugestoes?lat=${BLU.lat}&lng=${BLU.lng}&raioKm=10`,
    );
    expect(res.status).toBe(200);
    const itens = res.json.itens as {
      uid: string;
      seguidoPorMim: boolean;
      motivo: {tipo: string; texto: string};
    }[];
    const porUid = new Map(itens.map((item) => [item.uid, item]));
    expect(porUid.get("org")?.motivo).toEqual({
      tipo: "organizou_role",
      texto: `Organizou Serra · ${km40} km`,
    });
    expect(porUid.has("longe")).toBe(false);
    expect(porUid.has("secreta")).toBe(false);
    expect(porUid.has("semmarca")).toBe(false);
    expect(porUid.get("antiga")?.motivo.texto).toBe(`Telemetria pública · ${km40} km`);
    expect(porUid.get("tela")?.motivo.texto).toBe("Telemetria pública saindo de Mirante");
    expect(porUid.get("story")?.motivo).toEqual({
      tipo: "publicou",
      texto: "Publicou em Bar do Moto",
    });
    expect(porUid.has("oculto")).toBe(false);
    expect(porUid.get("voltou")?.motivo.tipo).toBe("segue_voce");
    expect(itens.every((item) => item.seguidoPorMim === false)).toBe(true);
    const tipos = new Set(itens.map((item) => item.motivo.tipo));
    expect(tipos.has("organizou_role")).toBe(true);
    expect([...tipos].every((tipo) =>
      ["segue_voce", "seguido_por", "organizou_role", "telemetria", "publicou"]
        .includes(tipo),
    )).toBe(true);
  });

  it("uma faixa que falha não derruba as outras", async () => {
    banco.usuarios.set("bia", pessoa("bia", "Bia"));
    banco.seguidores.set("ana", ["bia"]);
    banco.falharFaixa = "organizou_role";
    banco.roles.push({
      criadorId: "bia",
      titulo: "Serra",
      lat: norte(10),
      lng: BLU.lng,
      dataHoraSaida: "2026-12-01T12:00:00.000Z",
    });
    const res = await chamar(
      "GET",
      `/usuarios/sugestoes?lat=${BLU.lat}&lng=${BLU.lng}`,
    );
    expect(res.status).toBe(200);
    expect(res.json.itens).toEqual([
      expect.objectContaining({
        uid: "bia",
        motivo: expect.objectContaining({tipo: "segue_voce"}),
      }),
    ]);
    expect(log.warn).toHaveBeenCalled();
  });
});
