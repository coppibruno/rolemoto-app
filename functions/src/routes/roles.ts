import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {isDonoOuAdmin} from "../middleware/authorize";
import {responderErro} from "../middleware/errors";
import {rateLimitAutenticado} from "../middleware/rate-limit";
import {param} from "../lib/params";
import {distanciaRotaKm, haversineKm} from "../lib/geo";
import {
  agendarLembrete,
  cancelarLembretesDoRole,
  reagendarLembretesDoRole,
} from "../lib/lembretes";
import {log} from "../lib/log";
import {notificarCancelamentoRole} from "../lib/notificacoes";
import {horaSaoPaulo, resolverIntervaloQuando} from "../lib/quando";
import {validarQueryRoles} from "../lib/roles-query";
import {
  blocoVazio,
  enriquecerParticipantesRoles,
  listarParticipantesRole,
} from "../lib/participantes";
import {
  roleRepository,
  usuarioRepository,
  usuarioRoleRepository,
} from "../repositories";
import {participacaoRouter} from "./participacao";
import {feedbackRoleRouter} from "./feedback-role";
import {telemetriaRoleRouter} from "./telemetria-role";
import type {
  Localizacao,
  Role,
  RoleCriadorResumo,
  RoleDetalhe,
  RoleFeedItem,
  RoleModelo,
  RolePublicacao,
  RitmoRole,
} from "../types/role";
import type {ParticipantesBloco} from "../types/participante";

/**
 * REST de rolês.
 *
 * GET    /roles
 * GET    /roles/:id/modelo
 * GET    /roles/:id/participantes
 * GET    /roles/:id/telemetria
 * POST   /roles/:id/telemetria
 * GET    /roles/:id
 * POST   /roles
 * PUT    /roles/:id
 * DELETE /roles/:id
 */
export const rolesRouter = Router();

rolesRouter.use(autenticar);
rolesRouter.use(rateLimitAutenticado);
rolesRouter.use(participacaoRouter);
rolesRouter.use(feedbackRoleRouter);
rolesRouter.use(telemetriaRoleRouter);

const RITMOS: RitmoRole[] = ["tranquila", "moderada", "agressiva"];

const isRitmo = (valor: unknown): valor is RitmoRole =>
  typeof valor === "string" && (RITMOS as string[]).includes(valor);

const isCoordLat = (valor: unknown): valor is number =>
  typeof valor === "number" && Number.isFinite(valor) && valor >= -90 && valor <= 90;

const isCoordLng = (valor: unknown): valor is number =>
  typeof valor === "number" &&
  Number.isFinite(valor) &&
  valor >= -180 &&
  valor <= 180;

const normalizarNome = (valor: unknown): string | null => {
  if (valor === undefined || valor === null) return "";
  if (typeof valor !== "string") return null;
  const n = valor.trim();
  if (n.length > 60) return null;
  return n;
};

const parseLocalizacao = (valor: unknown): Localizacao | null => {
  if (!valor || typeof valor !== "object") {
    return null;
  }
  const o = valor as Localizacao;
  if (
    !isCoordLat(o.lat) ||
    !isCoordLng(o.lng) ||
    typeof o.endereco !== "string" ||
    o.endereco.trim().length < 3
  ) {
    return null;
  }
  const nome = normalizarNome(o.nome);
  if (nome === null) {
    return null;
  }
  return {
    lat: o.lat,
    lng: o.lng,
    endereco: o.endereco.trim(),
    nome,
  };
};

const textoContem = (haystack: string, needle: string): boolean =>
  haystack.toLowerCase().includes(needle);

const bateBusca = (role: Role, q: string): boolean => {
  const termo = q.toLowerCase();
  return (
    textoContem(role.titulo, termo) ||
    textoContem(role.descricao, termo) ||
    textoContem(role.localSaida.endereco, termo) ||
    textoContem(role.destinoFinal.endereco, termo) ||
    textoContem(role.localSaida.nome, termo) ||
    textoContem(role.destinoFinal.nome, termo)
  );
};

const enriquecerCriadores = async (
  roles: Role[],
): Promise<Map<string, RoleCriadorResumo>> => {
  const cache = new Map<string, RoleCriadorResumo>();
  const uids = [...new Set(roles.map((r) => r.criadorId).filter(Boolean))];
  await Promise.all(
    uids.map(async (uid) => {
      const usuario = await usuarioRepository.buscarPorId(uid);
      cache.set(uid, {
        uid,
        apelido: usuario?.apelido || "piloto",
        fotoUrl: usuario?.fotoUrl || "",
      });
    }),
  );
  return cache;
};

const paraFeedItem = (
  role: Role,
  criadores: Map<string, RoleCriadorResumo>,
  origem: {lat: number; lng: number},
  participantes: ParticipantesBloco,
): RoleFeedItem => {
  const distanciaPartidaKm = Math.round(
    haversineKm(origem.lat, origem.lng, role.localSaida.lat, role.localSaida.lng),
  );
  const rotaKm = distanciaRotaKm(role.localSaida, role.destinoFinal);
  const criador = criadores.get(role.criadorId) ?? {
    uid: role.criadorId,
    apelido: "piloto",
    fotoUrl: "",
  };
  return {
    ...role,
    distanciaPartidaKm,
    distanciaRotaKm: rotaKm,
    criador,
    participantes,
  };
};

const resumoCriador = async (criadorId: string): Promise<RoleCriadorResumo> => {
  const usuario = await usuarioRepository.buscarPorId(criadorId);
  return {
    uid: criadorId,
    apelido: usuario?.apelido || "piloto",
    fotoUrl: usuario?.fotoUrl || "",
  };
};

const paraDetalhe = async (
  role: Role,
  uid: string,
): Promise<RoleDetalhe> => {
  const [criador, confirmados, minhaParticipacao] = await Promise.all([
    resumoCriador(role.criadorId),
    usuarioRoleRepository.contarConfirmados(role.id),
    usuarioRoleRepository.buscarPorUsuarioERole(uid, role.id),
  ]);
  const distanciaKm = distanciaRotaKm(role.localSaida, role.destinoFinal);
  return {
    ...role,
    criador,
    distanciaKm,
    participantes: {confirmados},
    minhaParticipacao,
  };
};

const validarBodyCriacao = (
  body: Record<string, unknown>,
): {ok: true; dados: RolePublicacao} | {ok: false; erro: string} => {
  const titulo = body.titulo;
  const descricaoBruta = body.descricao;
  const fotoCapaUrl = body.fotoCapaUrl;
  const ritmo = body.ritmo;
  const dataHoraSaida = body.dataHoraSaida;
  const localSaida = body.localSaida;
  const destinoFinal = body.destinoFinal;

  if (
    typeof titulo !== "string" ||
    titulo.trim().length < 3 ||
    titulo.trim().length > 80
  ) {
    return {ok: false, erro: "titulo é obrigatório"};
  }

  if (
    descricaoBruta !== undefined &&
    descricaoBruta !== null &&
    (typeof descricaoBruta !== "string" || descricaoBruta.trim().length > 2000)
  ) {
    return {ok: false, erro: "descricao inválida"};
  }

  if (typeof fotoCapaUrl !== "string" || !fotoCapaUrl.trim()) {
    return {ok: false, erro: "fotoCapaUrl é obrigatória"};
  }

  if (!isRitmo(ritmo)) {
    return {ok: false, erro: "ritmo inválido"};
  }

  if (typeof dataHoraSaida !== "string" || !dataHoraSaida.trim()) {
    return {ok: false, erro: "dataHoraSaida inválida"};
  }
  const instante = Date.parse(dataHoraSaida);
  if (Number.isNaN(instante)) {
    return {ok: false, erro: "dataHoraSaida inválida"};
  }
  if (instante <= Date.now()) {
    return {ok: false, erro: "a partida precisa ser no futuro"};
  }

  const localSaidaOk = parseLocalizacao(localSaida);
  if (!localSaidaOk) {
    return {ok: false, erro: "localSaida inválida"};
  }
  const destinoFinalOk = parseLocalizacao(destinoFinal);
  if (!destinoFinalOk) {
    return {ok: false, erro: "destinoFinal inválida"};
  }

  const descricao =
    typeof descricaoBruta === "string" ? descricaoBruta.trim() : "";

  return {
    ok: true,
    dados: {
      titulo: titulo.trim(),
      descricao,
      fotoCapaUrl: fotoCapaUrl.trim(),
      ritmo,
      dataHoraSaida,
      localSaida: localSaidaOk,
      destinoFinal: destinoFinalOk,
    },
  };
};

rolesRouter.get("/", async (req: Request, res: Response) => {
  try {
    const query = validarQueryRoles(req);
    if ("erro" in query) {
      res.status(query.status).json({erro: query.erro});
      return;
    }

    const intervalo = resolverIntervaloQuando(query.quando, query.data);
    const listados = await roleRepository.listar({
      dataInicioIso: intervalo.dataInicioIso,
      dataFimIso: intervalo.dataFimIso,
      ritmo: query.ritmo,
    });

    const filtrados = listados.filter((role) => {
      const distancia = haversineKm(
        query.lat,
        query.lng,
        role.localSaida.lat,
        role.localSaida.lng,
      );
      if (query.raioKm !== undefined && distancia > query.raioKm) {
        return false;
      }
      if (query.q && !bateBusca(role, query.q)) {
        return false;
      }
      return true;
    });

    filtrados.sort((a, b) => a.dataHoraSaida.localeCompare(b.dataHoraSaida));

    const [criadores, participantesPorRole] = await Promise.all([
      enriquecerCriadores(filtrados),
      enriquecerParticipantesRoles(filtrados.map((r) => r.id)),
    ]);
    const itens = filtrados.map((role) =>
      paraFeedItem(
        role,
        criadores,
        query,
        participantesPorRole.get(role.id) ?? blocoVazio(),
      ),
    );
    res.json(itens);
  } catch (error) {
    responderErro(res, error);
  }
});

rolesRouter.get("/:id/modelo", async (req: Request, res: Response) => {
  try {
    const usuario = req.usuario;
    if (!usuario) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const role = await roleRepository.buscarPorId(param(req, "id"));
    if (!role) {
      res.status(404).json({erro: "Rolê não encontrado"});
      return;
    }
    if (!isDonoOuAdmin(usuario, role.criadorId)) {
      res.status(403).json({
        erro: "Apenas o criador pode clonar ou editar este rolê",
      });
      return;
    }

    const modelo: RoleModelo = {
      roleIdOrigem: role.id,
      titulo: role.titulo,
      descricao: role.descricao,
      fotoCapaUrl: role.fotoCapaUrl,
      ritmo: role.ritmo,
      localSaida: role.localSaida,
      destinoFinal: role.destinoFinal,
      horaSaida: horaSaoPaulo(role.dataHoraSaida),
      dataHoraSaida: role.dataHoraSaida,
    };
    res.json(modelo);
  } catch (error) {
    responderErro(res, error);
  }
});

rolesRouter.get("/:id/participantes", async (req: Request, res: Response) => {
  try {
    if (!req.usuario?.uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const role = await roleRepository.buscarPorId(param(req, "id"));
    if (!role) {
      res.status(404).json({erro: "Rolê não encontrado"});
      return;
    }

    const lista = await listarParticipantesRole(role.id);
    res.json(lista);
  } catch (error) {
    responderErro(res, error);
  }
});

rolesRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const role = await roleRepository.buscarPorId(param(req, "id"));
    if (!role) {
      res.status(404).json({erro: "Rolê não encontrado"});
      return;
    }
    const detalhe = await paraDetalhe(role, uid);
    res.json(detalhe);
  } catch (error) {
    responderErro(res, error);
  }
});

rolesRouter.post("/", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const validado = validarBodyCriacao(
      (req.body ?? {}) as Record<string, unknown>,
    );
    if (!validado.ok) {
      res.status(400).json({erro: validado.erro});
      return;
    }

    const criado = await roleRepository.criar({
      ...validado.dados,
      criadorId: uid,
    });
    await agendarLembrete(
      {roleId: criado.id, userId: uid, titulo: criado.titulo},
      criado.dataHoraSaida,
    );
    log.info("Role", "Rolê criado", {roleId: criado.id, criadorId: uid});
    res.status(201).json(criado);
  } catch (error) {
    responderErro(res, error);
  }
});

rolesRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const usuario = req.usuario;
    if (!usuario) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const id = param(req, "id");
    const existente = await roleRepository.buscarPorId(id);
    if (!existente) {
      res.status(404).json({erro: "Rolê não encontrado"});
      return;
    }
    if (!isDonoOuAdmin(usuario, existente.criadorId)) {
      res.status(403).json({
        erro: "Apenas o criador pode alterar este rolê",
      });
      return;
    }

    if (Date.parse(existente.dataHoraSaida) <= Date.now()) {
      res.status(409).json({erro: "Não dá para editar um rolê que já saiu"});
      return;
    }

    const validado = validarBodyCriacao(
      (req.body ?? {}) as Record<string, unknown>,
    );
    if (!validado.ok) {
      res.status(400).json({erro: validado.erro});
      return;
    }

    const atualizado = await roleRepository.atualizar(id, validado.dados);
    if (!atualizado) {
      res.status(404).json({erro: "Rolê não encontrado"});
      return;
    }

    if (validado.dados.dataHoraSaida !== existente.dataHoraSaida) {
      const aceitos = await usuarioRoleRepository.listarConfirmadosDoRole(
        id,
        100,
      );
      const userIds = aceitos.map((p) => p.usuarioId);
      await cancelarLembretesDoRole(id, userIds, existente.criadorId);
      await reagendarLembretesDoRole(
        id,
        atualizado.titulo,
        atualizado.dataHoraSaida,
        userIds,
        existente.criadorId,
      );
      log.info("Role", "Lembretes reagendados", {
        roleId: id,
        participantes: userIds.length + 1,
        novaDataHoraSaida: atualizado.dataHoraSaida,
      });
    }

    log.info("Role", "Rolê atualizado", {roleId: id, criadorId: existente.criadorId});
    res.json(atualizado);
  } catch (error) {
    responderErro(res, error);
  }
});

rolesRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const usuario = req.usuario;
    if (!usuario) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const id = param(req, "id");
    const existente = await roleRepository.buscarPorId(id);
    if (!existente) {
      res.status(404).json({erro: "Rolê não encontrado"});
      return;
    }
    if (!isDonoOuAdmin(usuario, existente.criadorId)) {
      res.status(403).json({
        erro: "Apenas o criador pode remover este rolê",
      });
      return;
    }

    const aceitos = await usuarioRoleRepository.listarConfirmadosDoRole(
      id,
      100,
    );
    const userIds = aceitos.map((p) => p.usuarioId);
    await cancelarLembretesDoRole(id, userIds, existente.criadorId);

    const notificar = aceitos
      .map((p) => p.usuarioId)
      .filter((uid) => uid && uid !== existente.criadorId);
    await Promise.all(
      notificar.map((uid) =>
        notificarCancelamentoRole(uid, id, existente.titulo),
      ),
    );

    const vinculosRemovidos = await usuarioRoleRepository.removerPorRoleId(id);
    await roleRepository.remover(id);
    log.info("Role", "Rolê removido", {
      roleId: id,
      criadorId: existente.criadorId,
      lembretesCancelados: userIds.length + 1,
      vinculosRemovidos,
    });
    res.status(204).send();
  } catch (error) {
    responderErro(res, error);
  }
});
