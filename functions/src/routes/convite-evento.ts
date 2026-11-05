import {Router, Request, Response} from "express";
import {apelidoExibicao} from "../lib/apelido";
import {
  classificarConvites,
  fraseConvite,
  LIMITE_ENVIO_CONVITE,
  LIMITE_SITUACAO_CONVITE,
  quandoConvite,
  uidsUnicos,
} from "../lib/convite-evento";
import {erroDe, log} from "../lib/log";
import {notificarConvitesEvento} from "../lib/notificacoes";
import {param} from "../lib/params";
import {responderErro} from "../middleware/errors";
import {
  conviteEventoRepository,
  eventoRepository,
  usuarioRepository,
} from "../repositories";
import {eventoAindaAberto} from "./inscricao-evento";
import type {Evento} from "../types/evento";
import type {ResultadoConvites} from "../types/convite-evento";

/**
 * POST /eventos/:id/convites/situacao
 * POST /eventos/:id/convites
 */
export const conviteEventoRouter = Router();

const uidAutenticado = (req: Request, res: Response): string | null => {
  const uid = req.usuario?.uid;
  if (!uid) {
    res.status(401).json({erro: "Não autenticado"});
    return null;
  }
  return uid;
};

const lerUids = (body: unknown): string[] | null => {
  if (!body || typeof body !== "object") {
    return null;
  }
  return uidsUnicos((body as {uids?: unknown}).uids);
};

const carregarAberto = async (
  eventoId: string,
): Promise<{ok: true; evento: Evento} | {ok: false; status: number; erro: string}> => {
  const evento = await eventoRepository.buscarPorId(eventoId);
  if (!evento) {
    return {ok: false, status: 404, erro: "Evento não encontrado"};
  }
  if (evento.cancelada) {
    return {ok: false, status: 400, erro: "esta data foi cancelada"};
  }
  if (!eventoAindaAberto(evento)) {
    return {ok: false, status: 400, erro: "este evento já encerrou"};
  }
  return {ok: true, evento};
};

const recusarTamanho = (
  res: Response,
  uids: string[] | null,
  maximo: number,
  erro: string,
): uids is null => {
  if (!uids || uids.length === 0 || uids.length > maximo) {
    res.status(400).json({erro});
    return true;
  }
  return false;
};

conviteEventoRouter.post(
  "/:id/convites/situacao",
  async (req: Request, res: Response) => {
    try {
      const token = uidAutenticado(req, res);
      if (!token) {
        return;
      }
      const uids = lerUids(req.body);
      if (recusarTamanho(
        res,
        uids,
        LIMITE_SITUACAO_CONVITE,
        "escolha até 30 pilotos",
      )) {
        return;
      }
      const eventoId = param(req, "id");
      const aberto = await carregarAberto(eventoId);
      if (!aberto.ok) {
        res.status(aberto.status).json({erro: aberto.erro});
        return;
      }
      const situacao = await conviteEventoRepository.presentes(
        token,
        eventoId,
        uids,
      );
      res.status(200).json(situacao);
    } catch (error) {
      responderErro(res, error);
    }
  },
);

conviteEventoRouter.post(
  "/:id/convites",
  async (req: Request, res: Response) => {
    try {
      const token = uidAutenticado(req, res);
      if (!token) {
        return;
      }
      const uids = lerUids(req.body);
      if (recusarTamanho(
        res,
        uids,
        LIMITE_ENVIO_CONVITE,
        "escolha até 20 pilotos",
      )) {
        return;
      }
      const eventoId = param(req, "id");
      const aberto = await carregarAberto(eventoId);
      if (!aberto.ok) {
        res.status(aberto.status).json({erro: aberto.erro});
        return;
      }

      const [pessoas, presenca] = await Promise.all([
        usuarioRepository.buscarPorIds(uids),
        conviteEventoRepository.presentes(token, eventoId, uids),
      ]);
      const classe = classificarConvites(uids, {
        tokenUid: token,
        perfisExistentes: new Set(pessoas.map((pessoa) => pessoa.uid)),
        inscritos: new Set(presenca.inscritos),
        jaConvidados: new Set(presenca.convidados),
      });
      const gravados = await conviteEventoRepository.criar(
        token,
        eventoId,
        classe.enviados,
      );
      const gravadosSet = new Set(gravados);
      const enviados = classe.enviados.filter((uid) => gravadosSet.has(uid));
      const jaConvidados = [
        ...classe.jaConvidados,
        ...classe.enviados.filter((uid) => !gravadosSet.has(uid)),
      ];
      const corpo: ResultadoConvites = {
        enviados,
        jaConvidados,
        jaInscritos: classe.jaInscritos,
        ignorados: classe.ignorados,
      };
      await avisarEnviados(token, aberto.evento, enviados);
      log.info("ConviteEvento", "Convites processados", {
        eventoId,
        uid: token,
        enviados: enviados.length,
      });
      res.status(enviados.length > 0 ? 201 : 200).json(corpo);
    } catch (error) {
      responderErro(res, error);
    }
  },
);

const avisarEnviados = async (
  token: string,
  evento: Evento,
  enviados: string[],
): Promise<void> => {
  const destinatarios = enviados.filter((uid) => uid !== token);
  if (destinatarios.length === 0) {
    return;
  }
  try {
    const eu = await usuarioRepository.buscarPorId(token);
    await notificarConvitesEvento(
      destinatarios,
      evento.id,
      fraseConvite(apelidoExibicao(eu), evento.titulo),
      quandoConvite(evento.dataHoraAbertura, evento.dataHoraEncerramento),
    );
  } catch (error) {
    log.warn("ConviteEvento", "Falha no push", {
      eventoId: evento.id,
      uid: token,
      ...erroDe(error),
    });
  }
};
