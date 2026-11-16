import type {AddressInfo} from "node:net";
import type {Server} from "node:http";
import express, {Router} from "express";
import type {NextFunction, Request, Response} from "express";
import {afterAll, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import type {Role, RoleCreate, RoleUpdate} from "../types/role";

const banco = vi.hoisted(() => ({
  roles: new Map<string, Role>(),
  seq: 0,
}));

vi.mock("../lib/log", () => ({
  log: {info: vi.fn(), warn: vi.fn(), error: vi.fn()},
  erroDe: (e: unknown) => ({detalhe: String(e)}),
}));

vi.mock("../middleware/rate-limit", () => ({
  rateLimitAutenticado: (_req: Request, _res: Response, next: NextFunction) => next(),
  rateLimit: () => (_req: Request, _res: Response, next: NextFunction) => next(),
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

vi.mock("../lib/firebase-admin", () => ({firestore: {}, adminAuth: {}, adminStorage: {}}));

vi.mock("../lib/lembretes", () => ({
  agendarLembrete: async () => undefined,
  cancelarLembretesDoRole: async () => undefined,
  reagendarLembretesDoRole: async () => undefined,
}));

vi.mock("../lib/notificacoes", () => ({
  notificarCancelamentoRole: async () => ({tokens: 0, sucesso: 0, falha: 0, erros: []}),
}));

vi.mock("../lib/participantes", () => ({
  blocoVazio: () => ({total: 0, destaques: []}),
  enriquecerParticipantesRoles: async () => new Map(),
  listarParticipantesRole: async () => [],
}));

vi.mock("./participacao", () => ({participacaoRouter: Router()}));
vi.mock("./feedback-role", () => ({feedbackRoleRouter: Router()}));

vi.mock("../repositories", () => ({
  roleRepository: {
    listar: async () => [...banco.roles.values()],
    buscarPorId: async (id: string) => {
      const role = banco.roles.get(id);
      return role ? structuredClone(role) : null;
    },
    criar: async (dados: RoleCreate) => {
      banco.seq += 1;
      const role: Role = {
        ...dados,
        id: `role${banco.seq}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      banco.roles.set(role.id, role);
      return structuredClone(role);
    },
    atualizar: async (id: string, dados: RoleUpdate) => {
      const atual = banco.roles.get(id);
      if (!atual) return null;
      const novo = {...atual, ...dados} as Role;
      banco.roles.set(id, novo);
      return structuredClone(novo);
    },
  },
  usuarioRepository: {
    buscarPorId: async (uid: string) => ({uid, nome: "Ana Lima", apelido: "ana", fotoUrl: ""}),
    buscarPorIds: async () => [],
  },
  usuarioRoleRepository: {
    listarPorUsuario: async () => [],
    contarConfirmados: async () => 0,
    buscarPorUsuarioERole: async () => null,
    listarConfirmadosDoRole: async () => [],
  },
  usuarioRoleFeedbackRepository: {},
  seguirRepository: {
    vinculosCom: async () => new Map(),
  },
}));

const {rolesRouter} = await import("./roles");
const {rolesPublicoRouter} = await import("./roles-publico");

const DIA_MS = 24 * 60 * 60 * 1000;
const BLUMENAU = {lat: -26.9189, lng: -49.0661, endereco: "Blumenau, SC", nome: "Posto"};
const POMERODE = {lat: -26.7406, lng: -49.1761, endereco: "Pomerode, SC", nome: "Café"};
const JARAGUA = {lat: -26.4851, lng: -49.0713, endereco: "Jaraguá do Sul, SC", nome: ""};
const JOINVILLE = {lat: -26.3045, lng: -48.8487, endereco: "Joinville, SC", nome: "Mirante"};

const corpo = (extra: Record<string, unknown> = {}) => ({
  titulo: "Serra das paradas",
  ritmo: "moderada",
  dataHoraSaida: new Date(Date.now() + 3 * DIA_MS).toISOString(),
  localSaida: BLUMENAU,
  destinoFinal: JOINVILLE,
  ...extra,
});

let server: Server;
let base = "";

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use("/roles", rolesRouter);
  app.use("/publico/roles", rolesPublicoRouter);
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
});

beforeEach(() => {
  banco.roles.clear();
  banco.seq = 0;
});

const chamar = async (
  metodo: string,
  caminho: string,
  body?: unknown,
  uid: string | null = "ana",
) => {
  const headers: Record<string, string> = {"Content-Type": "application/json"};
  if (uid) headers["x-uid"] = uid;
  const res = await fetch(`${base}${caminho}`, {
    method: metodo,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const texto = await res.text();
  return {status: res.status, json: texto ? JSON.parse(texto) : null};
};

const criarComParadas = async () => {
  const res = await chamar("POST", "/roles", corpo({paradas: [POMERODE, JARAGUA]}));
  expect(res.status).toBe(201);
  return res.json as Role;
};

describe("paradas do rolê — API", () => {
  it("POST grava as paradas na ordem e ausente vira []", async () => {
    const criado = await criarComParadas();
    expect(criado.paradas.map((p) => p.endereco)).toEqual([
      "Pomerode, SC",
      "Jaraguá do Sul, SC",
    ]);
    const semCampo = await chamar("POST", "/roles", corpo());
    expect(semCampo.status).toBe(201);
    expect(semCampo.json.paradas).toEqual([]);
  });

  it("ponto fora do Sul e nona parada respondem 400", async () => {
    const fora = await chamar("POST", "/roles", corpo({
      paradas: [{lat: -23.55, lng: -46.63, endereco: "São Paulo, SP", nome: ""}],
    }));
    expect(fora.status).toBe(400);
    expect(fora.json.erro).toBe("Localização deve estar em SC, PR ou RS");
    const nove = Array.from({length: 9}, () => POMERODE);
    const teto = await chamar("POST", "/roles", corpo({paradas: nove}));
    expect(teto.status).toBe(400);
  });

  it("PUT troca as paradas e rolê que já saiu continua 409", async () => {
    const criado = await criarComParadas();
    const put = await chamar("PUT", `/roles/${criado.id}`, corpo({paradas: [JARAGUA]}));
    expect(put.status).toBe(200);
    expect(put.json.paradas).toHaveLength(1);

    const antigo = banco.roles.get(criado.id) as Role;
    antigo.dataHoraSaida = new Date(Date.now() - DIA_MS).toISOString();
    const saiu = await chamar("PUT", `/roles/${criado.id}`, corpo({paradas: []}));
    expect(saiu.status).toBe(409);
  });

  it("feed manda totalParadas e a distância da cadeia, sem o array", async () => {
    const criado = await criarComParadas();
    const feed = await chamar("GET", "/roles?lat=-26.9&lng=-49.06", undefined, "bia");
    expect(feed.status).toBe(200);
    const item = feed.json.find((r: {id: string}) => r.id === criado.id);
    expect(item.totalParadas).toBe(2);
    expect(item).not.toHaveProperty("paradas");
    const detalhe = await chamar("GET", `/roles/${criado.id}`, undefined, "bia");
    expect(item.distanciaRotaKm).toBe(detalhe.json.distanciaKm);
    expect(detalhe.json.distanciaKm).toBeGreaterThan(70);
  });

  it("detalhe, modelo e convite público trazem a lista", async () => {
    const criado = await criarComParadas();
    const detalhe = await chamar("GET", `/roles/${criado.id}`, undefined, "bia");
    expect(detalhe.json.paradas).toHaveLength(2);
    const modelo = await chamar("GET", `/roles/${criado.id}/modelo`);
    expect(modelo.json.paradas.map((p: {nome: string}) => p.nome)).toEqual(["Café", ""]);
    const publico = await chamar("GET", `/publico/roles/${criado.id}`, undefined, null);
    expect(publico.status).toBe(200);
    expect(publico.json.paradas[0]).toEqual({
      nome: "Café",
      endereco: "Pomerode, SC",
      lat: POMERODE.lat,
      lng: POMERODE.lng,
    });
  });
});
