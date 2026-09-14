import {Router, Request, Response} from "express";
import {roleRepository, usuarioRoleRepository} from "../repositories";
import {notificarLembrete} from "../lib/notificacoes";
import type {PayloadLembrete} from "../types/lembrete";

export const lembretesRouter = Router();

/**
 * POST /lembretes/enviar
 *
 * Chamado exclusivamente pelo Cloud Tasks.
 * Sempre retorna 2xx para que a task seja consumida.
 */
lembretesRouter.post("/enviar", async (req: Request, res: Response) => {
  try {
    const {roleId, userId, titulo} = (req.body ?? {}) as PayloadLembrete;
    if (!roleId || !userId) {
      res.status(200).json({ignorado: "payload inválido"});
      return;
    }

    const role = await roleRepository.buscarPorId(roleId);
    if (!role) {
      res.status(200).json({ignorado: "rolê não encontrado"});
      return;
    }

    if (userId !== role.criadorId) {
      const participacao = await usuarioRoleRepository.buscarPorUsuarioERole(
        userId,
        roleId,
      );
      if (!participacao || !participacao.aceito) {
        res.status(200).json({ignorado: "piloto não está mais aceito"});
        return;
      }
      if (participacao.notificar === false) {
        res.status(200).json({ignorado: "notificações desligadas"});
        return;
      }
    }

    await notificarLembrete(userId, roleId, role.titulo || titulo);
    res.status(200).json({enviado: true});
  } catch (error) {
    console.error("Erro no lembrete:", error);
    res.status(200).json({erro: "falha no envio, task consumida"});
  }
});
