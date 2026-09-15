import {Router, Request, Response} from "express";
import {autenticarCloudTasks} from "../middleware/cloud-tasks-oidc";
import {log, erroDe} from "../lib/log";
import {roleRepository, usuarioRoleRepository} from "../repositories";
import {notificarLembrete} from "../lib/notificacoes";
import type {PayloadLembrete} from "../types/lembrete";

export const lembretesRouter = Router();

/**
 * POST /lembretes/enviar
 *
 * Chamado exclusivamente pelo Cloud Tasks (OIDC).
 * Após auth, sempre retorna 2xx para que a task seja consumida.
 */
lembretesRouter.post(
  "/enviar",
  autenticarCloudTasks,
  async (req: Request, res: Response) => {
    try {
      const {roleId, userId, titulo} = (req.body ?? {}) as PayloadLembrete;
      if (!roleId || !userId) {
        log.warn("Lembrete", "Payload inválido", {roleId, userId});
        res.status(200).json({ignorado: "payload inválido"});
        return;
      }

      const role = await roleRepository.buscarPorId(roleId);
      if (!role) {
        log.info("Lembrete", "Rolê não encontrado", {roleId, userId});
        res.status(200).json({ignorado: "rolê não encontrado"});
        return;
      }

      if (userId !== role.criadorId) {
        const participacao = await usuarioRoleRepository.buscarPorUsuarioERole(
          userId,
          roleId,
        );
        if (!participacao || !participacao.aceito) {
          log.info("Lembrete", "Piloto não aceito", {roleId, userId});
          res.status(200).json({ignorado: "piloto não está mais aceito"});
          return;
        }
        if (participacao.notificar === false) {
          log.info("Lembrete", "Notificações desligadas", {roleId, userId});
          res.status(200).json({ignorado: "notificações desligadas"});
          return;
        }
      }

      await notificarLembrete(userId, roleId, role.titulo || titulo);
      log.info("Lembrete", "Handler concluído", {roleId, userId});
      res.status(200).json({enviado: true});
    } catch (error) {
      log.error("Lembrete", "Erro no handler", {...erroDe(error)});
      res.status(200).json({erro: "falha no envio, task consumida"});
    }
  },
);
