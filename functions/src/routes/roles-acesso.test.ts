import type {AddressInfo} from "node:net";
import type {Server} from "node:http";
import express, {Router} from "express";
import type {NextFunction, Request, Response} from "express";
import {afterAll, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import type {Role, RoleCreate, RoleUpdate} from "../types/role";
import type {UsuarioRole, UsuarioRoleCreate} from "../types/usuario-role";

const banco = vi.hoisted(() => ({
  roles: new Map<string, Role>(),
  vinculos: new Map<string, UsuarioRole>(),
  seq: 0,
}));

const espias = vi.hoisted(() => ({
  pedidoVaga: vi.fn(async () => ({tokens: 0, sucesso: 0, falha: 0, erros: []})),
  entradaRole: vi.fn(async (..._args: unknown[]) => ({tokens: 0, sucesso: 0, falha: 0, erros: []})),
  agendarLembrete: vi.fn(async () => undefined),
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
  agendarLembrete: espias.agendarLembrete,
  cancelarLembrete: async () => undefined,
  cancelarLembretesDoRole: async () => undefined,
  reagendarLembretesDoRole: async () => undefined,
}));

vi.mock("../lib/notificacoes", () => ({
  notificarPedidoVaga: espias.pedidoVaga,
  notificarEntradaRole: espias.entradaRole,
  notificarCancelamentoRole: async () => ({tokens: 0, sucesso: 0, falha: 0, erros: []}),
}));

vi.mock("../lib/participantes", () => ({
  blocoVazio: () => ({total: 0, destaques: []}),
  enriquecerParticipantesRoles: async () => new Map(),
  listarParticipantesRole: async () => [],
}));

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
        fixado: false,
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
    fixarDentroDoTeto: async (id: string, fixado: boolean, teto: number) => {
      const role = banco.roles.get(id);
      if (!role) return "ausente";
      const outros = [...banco.roles.values()]
        .filter((r) => r.criadorId === role.criadorId && r.fixado && r.id !== id);
      if (fixado && !role.fixado && outros.length >= teto) return "teto";
      role.fixado = fixado;
      return "ok";
    },
  },
  usuarioRepository: {
    buscarPorId: async (uid: string) => ({uid, nome: "Ana Lima", apelido: "ana", fotoUrl: ""}),
    buscarPorIds: async () => [],
  },
  usuarioRoleRepository: {
    listarPorUsuario: async () => [],
    contarConfirmados: async () => 0,
    buscarPorUsuarioERole: async (uid: string, roleId: string) =>
      banco.vinculos.get(`${uid}_${roleId}`) ?? null,
    listarConfirmadosDoRole: async () => [],
    criar: async (dados: UsuarioRoleCreate) => {
      const id = `${dados.usuarioId}_${dados.roleId}`;
      const agora = new Date().toISOString();
      const vinculo: UsuarioRole = {
        id,
        usuarioId: dados.usuarioId,
        roleId: dados.roleId,
        criadorId: dados.criadorId,
        aceito: dados.aceito,
        notificar: true,
        createdAt: agora,
        updatedAt: agora,
        aceitoEm: dados.aceito ? agora : null,
        recusadoEm: null,
      };
      banco.vinculos.set(id, vinculo);
      return vinculo;
    },
  },
  usuarioRoleFeedbackRepository: {},
}));

const {rolesRouter} = await import("./roles");

const DIA_MS = 24 * 60 * 60 * 1000;
const BLUMENAU = {lat: -26.9189, lng: -49.0661, endereco: "Blumenau, SC", nome: "Posto"};
const JOINVILLE = {lat: -26.3045, lng: -48.8487, endereco: "Joinville, SC", nome: "Mirante"};

const corpo = (extra: Record<string, unknown> = {}) => ({
  titulo: "Serra aberta",
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
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
});

beforeEach(() => {
  banco.roles.clear();
  banco.vinculos.clear();
  banco.seq = 0;
  espias.pedidoVaga.mockClear();
  espias.entradaRole.mockReset();
  espias.entradaRole.mockResolvedValue({tokens: 0, sucesso: 0, falha: 0, erros: []});
  espias.agendarLembrete.mockClear();
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

describe("rolê aberto e fechado — RA1", () => {
  it("criar sem acesso grava aberto; valor fora do contrato é 400", async () => {
    const criado = await chamar("POST", "/roles", corpo());
    expect(criado.status).toBe(201);
    expect(criado.json.acesso).toBe("aberto");
    const invalido = await chamar("POST", "/roles", corpo({acesso: "publico"}));
    expect(invalido.status).toBe(400);
  });

  it("entrar no aberto volta aceito, agenda lembrete e não chama o push de pedido", async () => {
    const criado = await chamar("POST", "/roles", corpo());
    espias.agendarLembrete.mockClear();
    const entrada = await chamar("POST", `/roles/${criado.json.id}/participacao`, undefined, "bia");
    expect(entrada.status).toBe(201);
    expect(entrada.json.aceito).toBe(true);
    expect(entrada.json.aceitoEm).not.toBeNull();
    expect(espias.pedidoVaga).not.toHaveBeenCalled();
    expect(espias.agendarLembrete).toHaveBeenCalledTimes(1);
  });

  it("fechado segue pendente e avisa o líder", async () => {
    const criado = await chamar("POST", "/roles", corpo({acesso: "fechado"}));
    const pedido = await chamar("POST", `/roles/${criado.json.id}/participacao`, undefined, "bia");
    expect(pedido.status).toBe(201);
    expect(pedido.json.aceito).toBe(false);
    expect(espias.pedidoVaga).toHaveBeenCalledTimes(1);
    expect(espias.entradaRole).not.toHaveBeenCalled();
  });

  it("PUT ignora acesso diferente no body", async () => {
    const criado = await chamar("POST", "/roles", corpo());
    const put = await chamar("PUT", `/roles/${criado.json.id}`, corpo({acesso: "fechado"}));
    expect(put.status).toBe(200);
    expect(put.json.acesso).toBe("aberto");
  });
});

describe("aviso de entrada no rolê aberto — NE1", () => {
  it("201 no aberto avisa o criador com o título e a tela de gerenciar", async () => {
    const criado = await chamar("POST", "/roles", corpo());
    const entrada = await chamar("POST", `/roles/${criado.json.id}/participacao`, undefined, "bia");
    expect(entrada.status).toBe(201);
    expect(espias.entradaRole).toHaveBeenCalledTimes(1);
    expect(espias.entradaRole).toHaveBeenCalledWith("ana", criado.json.id, "Serra aberta");
  });

  it("o segundo POST devolve o vínculo e não manda outro push", async () => {
    const criado = await chamar("POST", "/roles", corpo());
    await chamar("POST", `/roles/${criado.json.id}/participacao`, undefined, "bia");
    const repetido = await chamar("POST", `/roles/${criado.json.id}/participacao`, undefined, "bia");
    expect(repetido.status).toBe(200);
    expect(espias.entradaRole).toHaveBeenCalledTimes(1);
  });

  it("falha do envio ainda responde 201", async () => {
    espias.entradaRole.mockRejectedValueOnce(new Error("fcm fora"));
    const criado = await chamar("POST", "/roles", corpo());
    const entrada = await chamar("POST", `/roles/${criado.json.id}/participacao`, undefined, "bia");
    expect(entrada.status).toBe(201);
    expect(entrada.json.aceito).toBe(true);
  });

  it("organizador e rolê que já saiu não disparam push", async () => {
    const criado = await chamar("POST", "/roles", corpo());
    const proprio = await chamar("POST", `/roles/${criado.json.id}/participacao`);
    expect(proprio.status).toBe(403);
    banco.roles.get(criado.json.id)!.dataHoraSaida = new Date(Date.now() - DIA_MS).toISOString();
    const passado = await chamar("POST", `/roles/${criado.json.id}/participacao`, undefined, "bia");
    expect(passado.status).toBe(400);
    expect(espias.entradaRole).not.toHaveBeenCalled();
  });
});

describe("fixar e reutilizar — FR1", () => {
  it("só o criador fixa; o 13º responde 400", async () => {
    const ids: string[] = [];
    for (let i = 0; i < 13; i += 1) {
      ids.push((await chamar("POST", "/roles", corpo())).json.id);
    }
    const alheio = await chamar("PATCH", `/roles/${ids[0]}/fixado`, {fixado: true}, "bia");
    expect(alheio.status).toBe(403);
    for (const id of ids.slice(0, 12)) {
      expect((await chamar("PATCH", `/roles/${id}/fixado`, {fixado: true})).status).toBe(200);
    }
    const decimoTerceiro = await chamar("PATCH", `/roles/${ids[12]}/fixado`, {fixado: true});
    expect(decimoTerceiro.status).toBe(400);
    expect(decimoTerceiro.json.erro).toBe("Você já fixou 12 rolês");
  });

  it("outro piloto pega o modelo só do fixado, com o acesso de origem", async () => {
    const criado = await chamar("POST", "/roles", corpo({acesso: "fechado"}));
    const antes = await chamar("GET", `/roles/${criado.json.id}/modelo`, undefined, "bia");
    expect(antes.status).toBe(403);
    await chamar("PATCH", `/roles/${criado.json.id}/fixado`, {fixado: true});
    const depois = await chamar("GET", `/roles/${criado.json.id}/modelo`, undefined, "bia");
    expect(depois.status).toBe(200);
    expect(depois.json.acesso).toBe("fechado");
  });
});
