import {eventoEncerrouParaAvaliacao, idFeedbackAlvo} from "./avaliacao-experiencia";
import type {Evento} from "../types/evento";
import type {UsuarioEventoFeedbackDoc} from "../types/avaliacao-experiencia";
import type {
  MeuEventoGaragemItem,
  MeusEventosGaragemPayload,
  StatusMeuEventoGaragem,
} from "../types/meus-roles";

export const TETO_MEUS_EVENTOS_GARAGEM = 80;

const statusDoEvento = (evento: Evento): StatusMeuEventoGaragem =>
  eventoEncerrouParaAvaliacao(evento) ? "concluido" : "confirmado";

const ordenarEventosGaragem = (
  itens: MeuEventoGaragemItem[],
): MeuEventoGaragemItem[] => {
  const confirmados = itens
    .filter((item) => item.status === "confirmado")
    .sort(
      (a, b) =>
        Date.parse(a.dataHoraAbertura) - Date.parse(b.dataHoraAbertura),
    );
  const concluidos = itens
    .filter((item) => item.status === "concluido")
    .sort(
      (a, b) =>
        Date.parse(b.dataHoraAbertura) - Date.parse(a.dataHoraAbertura),
    );
  return [...confirmados, ...concluidos];
};

export const montarItensEventosGaragem = (
  eventos: Evento[],
  feedbacksPorEventoId: Map<string, UsuarioEventoFeedbackDoc>,
  inscritosPorEventoId: Map<string, number>,
): MeusEventosGaragemPayload => {
  const itens: MeuEventoGaragemItem[] = eventos.map((evento) => {
    const feedback = feedbacksPorEventoId.get(evento.id) ?? null;
    return {
      eventoId: evento.id,
      titulo: evento.titulo,
      tipo: evento.tipo,
      fotoCapaUrl: evento.fotoCapaUrl,
      dataHoraAbertura: evento.dataHoraAbertura,
      dataHoraEncerramento: evento.dataHoraEncerramento,
      localNome: evento.local.nome ?? "",
      localEndereco: evento.local.endereco,
      status: statusDoEvento(evento),
      inscritosTotal: inscritosPorEventoId.get(evento.id) ?? 0,
      avaliado: feedback !== null,
      minhaAvaliacao: feedback ?
        {
          nota: feedback.nota,
          comentario: feedback.comentario,
          createdAt: feedback.createdAt,
        } :
        null,
      notaMedia: evento.notaMedia,
      totalAvaliacoes: evento.totalAvaliacoes,
    };
  });

  return {
    itens: ordenarEventosGaragem(itens).slice(0, TETO_MEUS_EVENTOS_GARAGEM),
  };
};

export const idsFeedbackEvento = (
  uid: string,
  eventoIds: string[],
): string[] => eventoIds.map((id) => idFeedbackAlvo(uid, id));
