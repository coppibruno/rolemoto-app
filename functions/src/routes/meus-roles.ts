import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {responderErro} from "../middleware/errors";
import {rateLimitAutenticado} from "../middleware/rate-limit";
import {
  idsFeedbackEvento,
  montarItensEventosGaragem,
} from "../lib/meus-eventos-garagem";
import {
  idsFeedbackLocal,
  locaisUnicosDeCheckins,
  montarItensLocaisGaragem,
  montarItensLocaisVisitados,
} from "../lib/meus-locais-garagem";
import {
  classificarMeusRoles,
  contarRolesFeitos,
  destaquesDe,
  filtrarRolesOcultosGaragem,
  montarContagens,
  montarContagensTipo,
  montarPayloadMeusRoles,
  montarTelemetria,
  ordenarPayload,
  paraMeuRoleItem,
  TETO_MEUS_ROLES,
  unirComCriados,
} from "../lib/meus-roles";
import {
  eventoRepository,
  historicoOcultoRepository,
  localRepository,
  roleRepository,
  roleTelemetriaRepository,
  usuarioEventoFeedbackRepository,
  usuarioEventoRepository,
  usuarioLocalCheckinRepository,
  usuarioLocalFavoritoRepository,
  usuarioLocalFeedbackRepository,
  usuarioRepository,
  usuarioRoleRepository,
} from "../repositories";
import type {Evento} from "../types/evento";
import type {Local} from "../types/local";
import type {Role} from "../types/role";
import type {Usuario} from "../types/usuario";
import type {
  UsuarioEventoFeedbackDoc,
  UsuarioLocalFeedbackDoc,
} from "../types/avaliacao-experiencia";

/**
 * Garagem do piloto autenticado.
 *
 * GET /meus-roles
 * GET /meus-roles/eventos
 * GET /meus-roles/locais
 */
export const meusRolesRouter = Router();

meusRolesRouter.use(autenticar);
meusRolesRouter.use(rateLimitAutenticado);

const LIMITE_DESTAQUES = 3;

meusRolesRouter.get("/", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const [
      pedidos,
      criados,
      eventosParticipados,
      locaisFavoritos,
      gravados,
      ocultos,
    ] = await Promise.all([
      usuarioRoleRepository.listarPorUsuario(uid),
      roleRepository.listarPorCriador(uid),
      usuarioEventoRepository.contarPorUsuario(uid),
      usuarioLocalFavoritoRepository.contarPorUsuario(uid),
      roleTelemetriaRepository.contarPorUsuario(uid),
      historicoOcultoRepository.listarPorUsuario(uid),
    ]);

    const rolesOcultos = new Set(
      ocultos.filter((item) => item.tipo === "role").map((item) => item.alvoId),
    );
    const eventosOcultos = ocultos.filter((item) => item.tipo === "evento")
      .length;
    const eventosVisiveis = Math.max(0, eventosParticipados - eventosOcultos);

    const idsPedidos = [...new Set(pedidos.map((pedido) => pedido.roleId))];
    const rolesPedidos = await roleRepository.buscarPorIds(idsPedidos);

    const rolesPorId = new Map<string, Role>();
    for (const role of rolesPedidos) {
      rolesPorId.set(role.id, role);
    }
    for (const criado of criados) {
      rolesPorId.set(criado.id, criado);
    }

    const classificados = filtrarRolesOcultosGaragem(
      unirComCriados(
        classificarMeusRoles(uid, pedidos, rolesPorId),
        criados,
      ),
      rolesOcultos,
    );
    const contagens = montarContagens(classificados);
    const telemetria = montarTelemetria(
      contarRolesFeitos(classificados),
      eventosVisiveis,
      locaisFavoritos,
      gravados,
    );
    const contagensTipo = montarContagensTipo(
      contagens,
      eventosVisiveis,
      locaisFavoritos,
      gravados,
    );
    const recorte = ordenarPayload(classificados).slice(0, TETO_MEUS_ROLES);

    const extras = await Promise.all(
      recorte.map(async (item) => {
        const [confirmados, vinculos] = await Promise.all([
          usuarioRoleRepository.contarConfirmados(item.role.id),
          usuarioRoleRepository.listarConfirmadosDoRole(
            item.role.id,
            LIMITE_DESTAQUES,
          ),
        ]);
        return {item, confirmados, vinculos};
      }),
    );

    const uids = new Set<string>();
    for (const extra of extras) {
      uids.add(extra.item.role.criadorId);
      for (const vinculo of extra.vinculos) {
        uids.add(vinculo.usuarioId);
      }
    }
    const usuarios = await usuarioRepository.buscarPorIds([...uids]);
    const usuariosPorId = new Map<string, Usuario>(
      usuarios.map((usuario) => [usuario.uid, usuario]),
    );

    const itens = extras.map(({item, confirmados, vinculos}) =>
      paraMeuRoleItem(
        item,
        confirmados,
        destaquesDe(vinculos, usuariosPorId),
        usuariosPorId,
      ),
    );

    res.json(
      montarPayloadMeusRoles(itens, telemetria, contagensTipo, contagens),
    );
  } catch (error) {
    responderErro(res, error);
  }
});

meusRolesRouter.get("/eventos", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const inscricoes = await usuarioEventoRepository.listarPorUsuario(uid);
    const eventoIds = [...new Set(inscricoes.map((item) => item.eventoId))];
    if (eventoIds.length === 0) {
      res.json({itens: []});
      return;
    }

    const [eventos, feedbacks, inscritosPorEvento, ocultos] = await Promise.all([
      eventoRepository.buscarPorIds(eventoIds),
      usuarioEventoFeedbackRepository.buscarPorIds(
        idsFeedbackEvento(uid, eventoIds),
      ),
      usuarioEventoRepository.contarPorEventos(eventoIds),
      historicoOcultoRepository.listarPorUsuario(uid),
    ]);

    const eventosOcultos = new Set(
      ocultos
        .filter((item) => item.tipo === "evento")
        .map((item) => item.alvoId),
    );

    const feedbacksPorEventoId = new Map<string, UsuarioEventoFeedbackDoc>();
    for (const feedback of feedbacks) {
      feedbacksPorEventoId.set(feedback.eventoId, feedback);
    }

    const eventosPorId = new Map<string, Evento>(
      eventos.map((evento) => [evento.id, evento]),
    );
    const eventosOrdenados = eventoIds
      .map((id) => eventosPorId.get(id))
      .filter((evento): evento is Evento => Boolean(evento));

    res.json(
      montarItensEventosGaragem(
        eventosOrdenados,
        feedbacksPorEventoId,
        inscritosPorEvento,
        eventosOcultos,
      ),
    );
  } catch (error) {
    responderErro(res, error);
  }
});

const recorteLocais = (req: Request): "favoritos" | "visitados" => {
  const bruto = req.query.recorte;
  return bruto === "visitados" ? "visitados" : "favoritos";
};

meusRolesRouter.get("/locais", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    if (recorteLocais(req) === "visitados") {
      const checkins = await usuarioLocalCheckinRepository.listarPorUsuario(uid);
      const visitas = locaisUnicosDeCheckins(checkins);
      if (visitas.length === 0) {
        res.json({itens: []});
        return;
      }

      const localIds = visitas.map((item) => item.localId);
      const [locais, feedbacks] = await Promise.all([
        localRepository.buscarPorIds(localIds),
        usuarioLocalFeedbackRepository.buscarPorIds(
          idsFeedbackLocal(uid, localIds),
        ),
      ]);
      const locaisPorId = new Map<string, Local>(
        locais.map((local) => [local.id, local]),
      );
      const feedbacksPorLocalId = new Map<string, UsuarioLocalFeedbackDoc>();
      for (const feedback of feedbacks) {
        feedbacksPorLocalId.set(feedback.localId, feedback);
      }
      res.json(
        montarItensLocaisVisitados(visitas, locaisPorId, feedbacksPorLocalId),
      );
      return;
    }

    const favoritos =
      await usuarioLocalFavoritoRepository.listarPorUsuario(uid);
    if (favoritos.length === 0) {
      res.json({itens: []});
      return;
    }

    const localIds = favoritos.map((item) => item.localId);
    const [locais, feedbacks] = await Promise.all([
      localRepository.buscarPorIds(localIds),
      usuarioLocalFeedbackRepository.buscarPorIds(
        idsFeedbackLocal(uid, localIds),
      ),
    ]);

    const locaisPorId = new Map<string, Local>(
      locais.map((local) => [local.id, local]),
    );
    const feedbacksPorLocalId = new Map<string, UsuarioLocalFeedbackDoc>();
    for (const feedback of feedbacks) {
      feedbacksPorLocalId.set(feedback.localId, feedback);
    }

    res.json(
      montarItensLocaisGaragem(favoritos, locaisPorId, feedbacksPorLocalId),
    );
  } catch (error) {
    responderErro(res, error);
  }
});
