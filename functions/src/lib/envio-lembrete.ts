import {erroDe, log} from "./log";
import {lembreteNaJanela} from "./lembretes";
import {notificarLembrete, notificarLembretes} from "./notificacoes";
import {
  dispositivoRepository,
  eventoRepository,
  roleRepository,
  usuarioEventoRepository,
  usuarioRoleRepository,
} from "../repositories";
import type {PayloadLembrete} from "../types/lembrete";

type ResultadoEnvio = {ignorado?: string; enviado?: true};

const ctx = (payload: PayloadLembrete) => ({
  alvo: payload.alvo,
  alvoId: payload.alvoId,
  userId: payload.userId,
  antecedencia: payload.antecedencia,
});

const enviarRole = async (payload: PayloadLembrete): Promise<ResultadoEnvio> => {
  const role = await roleRepository.buscarPorId(payload.alvoId);
  if (!role) {
    log.info("Lembrete", "Rolê não encontrado", ctx(payload));
    return {ignorado: "rolê não encontrado"};
  }
  if (!lembreteNaJanela(role.dataHoraSaida, payload.antecedencia)) {
    log.info("Lembrete", "Fora da janela", ctx(payload));
    return {ignorado: "fora da janela"};
  }
  if (payload.userId !== role.criadorId) {
    const participacao = await usuarioRoleRepository.buscarPorUsuarioERole(
      payload.userId,
      payload.alvoId,
    );
    if (!participacao || !participacao.aceito) {
      log.info("Lembrete", "Piloto não aceito", ctx(payload));
      return {ignorado: "piloto não está mais aceito"};
    }
    if (participacao.notificar === false) {
      log.info("Lembrete", "Notificações desligadas", ctx(payload));
      return {ignorado: "notificações desligadas"};
    }
  }
  await notificarLembrete(payload, role.titulo || payload.titulo);
  return {enviado: true};
};

const enviarAvisoEvento = async (
  payload: PayloadLembrete,
): Promise<ResultadoEnvio> => {
  const evento = await eventoRepository.buscarPorId(payload.alvoId);
  if (!evento) {
    log.info("Lembrete", "Evento não encontrado", ctx(payload));
    return {ignorado: "evento não encontrado"};
  }
  if (!lembreteNaJanela(evento.dataHoraAbertura, "24h")) {
    log.info("Lembrete", "Fora da janela", ctx(payload));
    return {ignorado: "fora da janela"};
  }
  const uids = await dispositivoRepository.listarUids();
  log.info("Lembrete", "Aviso do evento para a base", {
    ...ctx(payload),
    destinatarios: uids.length,
  });
  await notificarLembretes(uids, payload, evento.titulo || payload.titulo);
  return {enviado: true};
};

const enviarEvento = async (
  payload: PayloadLembrete,
): Promise<ResultadoEnvio> => {
  if (payload.audiencia === "todos") {
    return enviarAvisoEvento(payload);
  }
  const evento = await eventoRepository.buscarPorId(payload.alvoId);
  if (!evento) {
    log.info("Lembrete", "Evento não encontrado", ctx(payload));
    return {ignorado: "evento não encontrado"};
  }
  if (!lembreteNaJanela(evento.dataHoraAbertura, payload.antecedencia)) {
    log.info("Lembrete", "Fora da janela", ctx(payload));
    return {ignorado: "fora da janela"};
  }
  if (payload.userId !== evento.criadorId) {
    const inscricao = await usuarioEventoRepository.buscarPorUsuarioEEvento(
      payload.userId,
      payload.alvoId,
    );
    if (!inscricao) {
      log.info("Lembrete", "Piloto não inscrito", ctx(payload));
      return {ignorado: "piloto não está inscrito"};
    }
  }
  await notificarLembrete(payload, evento.titulo || payload.titulo);
  return {enviado: true};
};

/** Confere o vínculo na hora do disparo. Não lança — o handler consome a task. */
export const enviarLembreteAgendado = async (
  payload: PayloadLembrete,
): Promise<ResultadoEnvio> => {
  try {
    if (payload.alvo === "evento") {
      return await enviarEvento(payload);
    }
    return await enviarRole(payload);
  } catch (error) {
    log.error("Lembrete", "Erro ao enviar", {...ctx(payload), ...erroDe(error)});
    return {ignorado: "falha no envio"};
  }
};
