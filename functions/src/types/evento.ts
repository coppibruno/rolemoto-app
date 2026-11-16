import type {ParticipantesBloco} from "./participante";
import type {Localizacao} from "./role";

export type TipoEvento =
  | "moto_point"
  | "moto_point_semanal"
  | "track_day"
  | "cafe_pilotos"
  | "exposicao_custom";

export type AcessoEvento = "gratis" | "ingresso";

export type AtracaoEvento =
  | "estacionamento_monitorado"
  | "musica_ao_vivo"
  | "chopp_hamburguer"
  | "bancada_ferramentas"
  | "area_coberta";

/** Link externo do álbum (SPEC 065). Até 5 por ocorrência. */
export interface AlbumEvento {
  id: string;
  url: string;
  createdAt: string;
  criadoPor: string;
}

export type AlbumEventoPublico = {
  id: string;
  url: string;
  createdAt: string;
};

export type FotografoEventoPublico = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
};

export interface Evento {
  id: string;
  titulo: string;
  tipo: TipoEvento;
  local: Localizacao;
  /** Ponto do catálogo. Docs antigos sem o campo são `null`. */
  localId: string | null;
  dataHoraAbertura: string;
  dataHoraEncerramento: string | null;
  acesso: AcessoEvento;
  linkIngresso: string | null;
  atracoes: AtracaoEvento[];
  fotoCapaUrl: string;
  informacoes: string;
  criadorId: string;
  /** Série semanal. Docs antigos sem o campo são `null`. */
  serieId: string | null;
  /** `yyyy-mm-dd` da abertura em São Paulo. `null` no avulso. */
  ocorrenciaYmd: string | null;
  /** A regra da série não pisa numa data ajustada à mão. */
  ocorrenciaAjustada: boolean;
  /** Data pulada com inscrição ou avaliação. Docs antigos são `false`. */
  cancelada: boolean;
  /** Fotógrafo autorizado (SPEC 065). Docs antigos = `null`. */
  fotografoId: string | null;
  /** Links de álbum externo. Docs antigos = `[]`. */
  albuns: AlbumEvento[];
  /** Já disparou o push da 1ª publicação. Docs antigos = `false`. */
  albumNotificado: boolean;
  notaMedia: number;
  totalAvaliacoes: number;
  recomendacoesComboio: number;
  createdAt: string;
  updatedAt: string;
}

export type RecorrenciaEvento = {
  serieId: string;
  diaSemana: number;
  rotulo: string;
};

export type EventoPublicacao = Omit<
  Evento,
  | "id"
  | "criadorId"
  | "createdAt"
  | "updatedAt"
  | "notaMedia"
  | "totalAvaliacoes"
  | "recomendacoesComboio"
  | "fotografoId"
  | "albuns"
  | "albumNotificado"
>;

export type EventoCreate = EventoPublicacao & {criadorId: string};

export type EventoFeedItem = Evento & {
  distanciaKm: number;
  inscrito: boolean;
  avaliado: boolean;
  participantes: ParticipantesBloco;
  /** Há story ativa no álbum que o encontro abre. */
  aoVivo: boolean;
  recorrencia: RecorrenciaEvento | null;
};

export type EventoDetalhe = Omit<Evento, "albuns"> & {
  inscrito: boolean;
  inscritos: {total: number};
  avaliado: boolean;
  participantes: ParticipantesBloco;
  storiesAtivas: number;
  podePostarStory: boolean;
  recorrencia: RecorrenciaEvento | null;
  fotografo: FotografoEventoPublico | null;
  /** Sem `criadoPor`. */
  albuns: AlbumEventoPublico[];
  possoPublicarAlbum: boolean;
  possoGerenciarFotografo: boolean;
};

export const TIPOS_EVENTO: TipoEvento[] = [
  "moto_point",
  "moto_point_semanal",
  "track_day",
  "cafe_pilotos",
  "exposicao_custom",
];

export const ACESSOS_EVENTO: AcessoEvento[] = ["gratis", "ingresso"];

export const ATRACOES_EVENTO: AtracaoEvento[] = [
  "estacionamento_monitorado",
  "musica_ao_vivo",
  "chopp_hamburguer",
  "bancada_ferramentas",
  "area_coberta",
];
