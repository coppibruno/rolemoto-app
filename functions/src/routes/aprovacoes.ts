import {Router, Request, Response} from "express";
import {autenticar} from "../middleware/auth";
import {isDonoOuAdmin} from "../middleware/authorize";
import {responderErro} from "../middleware/errors";
import {rateLimitAutenticado} from "../middleware/rate-limit";
import {param} from "../lib/params";
import {
  jaDecidida,
  montarFilaAprovacoes,
  montarSolicitacaoLider,
  roleAindaNaoSaiu,
} from "../lib/aprovacoes";
import {agendarLembrete} from "../lib/lembretes";
import {log} from "../lib/log";
import {notificarAceite} from "../lib/notificacoes";
import {roleRepository, usuarioRoleRepository} from "../repositories";
import type {DecisaoPiloto, StatusAprovacao} from "../types/aprovacao";

/**
 * Inbox do piloto líder (coleção `usersrole`).
 *
 * GET   /aprovacoes
 * PATCH /aprovacoes/:id
 */
export const aprovacoesRouter = Router();

aprovacoesRouter.use(autenticar);
aprovacoesRouter.use(rateLimitAutenticado);

const STATUSES: StatusAprovacao[] = ["pendente", "aceito"];
const DECISOES: DecisaoPiloto[] = ["aceitar", "recusar"];

const isStatus = (valor: unknown): valor is StatusAprovacao =>
  typeof valor === "string" && (STATUSES as string[]).includes(valor);

const isDecisao = (valor: unknown): valor is DecisaoPiloto =>
  typeof valor === "string" && (DECISOES as string[]).includes(valor);

const queryString = (valor: unknown): string | undefined => {
  if (typeof valor === "string") {
    return valor;
  }
  if (Array.isArray(valor) && typeof valor[0] === "string") {
    return valor[0];
  }
  return undefined;
};

aprovacoesRouter.get("/", async (req: Request, res: Response) => {
  try {
    const uid = req.usuario?.uid;
    if (!uid) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const statusParam = queryString(req.query.status);
    if (statusParam !== undefined && !isStatus(statusParam)) {
      res.status(400).json({erro: "status inválido"});
      return;
    }

    const status: StatusAprovacao = statusParam ?? "pendente";
    const fila = await montarFilaAprovacoes(uid, status);
    res.json(fila);
  } catch (error) {
    responderErro(res, error);
  }
});

aprovacoesRouter.patch("/:id", async (req: Request, res: Response) => {
  try {
    const usuario = req.usuario;
    if (!usuario) {
      res.status(401).json({erro: "Não autenticado"});
      return;
    }

    const decisao = (req.body ?? {}).decisao;
    if (!isDecisao(decisao)) {
      res.status(400).json({erro: "decisao é obrigatória"});
      return;
    }

    const id = param(req, "id");
    const pedido = await usuarioRoleRepository.buscarPorId(id);
    if (!pedido) {
      res.status(404).json({erro: "Solicitação não encontrada"});
      return;
    }
    if (!isDonoOuAdmin(usuario, pedido.criadorId)) {
      res.status(403).json({erro: "somente o organizador decide"});
      return;
    }
    if (jaDecidida(pedido)) {
      res.status(409).json({erro: "solicitação já decidida"});
      return;
    }

    const role = await roleRepository.buscarPorId(pedido.roleId);
    if (!role) {
      res.status(404).json({erro: "Rolê não encontrado"});
      return;
    }
    if (!roleAindaNaoSaiu(role)) {
      res.status(400).json({erro: "este rolê já aconteceu"});
      return;
    }

    const atualizado = await usuarioRoleRepository.decidir(id, {decisao});
    if (!atualizado) {
      res.status(404).json({erro: "Solicitação não encontrada"});
      return;
    }
    if (
      (decisao === "aceitar" && atualizado.aceitoEm === null) ||
      (decisao === "recusar" && atualizado.recusadoEm === null)
    ) {
      res.status(409).json({erro: "solicitação já decidida"});
      return;
    }

    const item = await montarSolicitacaoLider(atualizado);
    if (!item) {
      res.status(404).json({erro: "Rolê não encontrado"});
      return;
    }

    if (decisao === "aceitar") {
      if (atualizado.notificar !== false) {
        await notificarAceite(
          atualizado.usuarioId,
          atualizado.roleId,
          role.titulo,
        );
      }
      await agendarLembrete(
        {
          roleId: role.id,
          userId: atualizado.usuarioId,
          titulo: role.titulo,
        },
        role.dataHoraSaida,
      );
    }

    log.info("Aprovacao", "Decisão registrada", {
      solicitacaoId: id,
      roleId: pedido.roleId,
      usuarioId: atualizado.usuarioId,
      decisao,
      notificar: atualizado.notificar,
    });

    res.json(item);
  } catch (error) {
    responderErro(res, error);
  }
});
