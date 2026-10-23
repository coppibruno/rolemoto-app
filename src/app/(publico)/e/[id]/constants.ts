import type { AcessoEvento, TipoEvento } from "@/types/evento";

export const COPY_ABERTO = "Inscrições abertas para novos participantes";
export const COPY_ENCERRADO = "Este evento já encerrou";
export const COPY_MICROCOPY =
  "A inscrição é imediata. Evento pago pede confirmação do ingresso no app.";
export const COPY_PRIMEIRO_PILOTO = "Seja o primeiro a confirmar presença";
export const COPY_GRADE_LABEL = "Presenças";
export const COPY_GRADE_COUNT = (n: number): string =>
  n === 1 ? "1 inscrito" : `${n} inscritos`;
export const COPY_CTA = "Participar do evento";
export const COPY_CTA_SUB = "Abrir o evento e se inscrever";
export const COPY_INFORMACOES_MAX = 220;
export const COPY_VER_EVENTO = "Ver evento";
export const COPY_LINK_COPIADO = "Link copiado";
export const COPY_PILL = "Convite aberto";
export const COPY_FICHA = "Detalhes do evento";

export const LABELS_TIPO_EVENTO: Record<TipoEvento, string> = {
  moto_point: "Moto Point",
  track_day: "Track Day / Pista",
  cafe_pilotos: "Café dos Pilotos",
  exposicao_custom: "Exposição & Custom",
};

export const LABELS_ACESSO_EVENTO: Record<AcessoEvento, string> = {
  gratis: "Entrada franca",
  ingresso: "Ingresso",
};
