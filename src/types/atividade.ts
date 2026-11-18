import type { AutorPost, ComentarioPost, PaginaPost, TipoMarcaPost } from "./post-foto";
import type { AcessoRole, RitmoRole } from "./role";
import type { CategoriaLocal } from "./local";

export type TipoConteudo =
  | "foto"
  | "telemetria"
  | "role_criado"
  | "role_realizado"
  | "avaliacao_local"
  | "avaliacao_evento"
  | "album_evento";

export type TipoCompacto = "entrada_role" | "inscricao_evento" | "selo";

export type TipoAtividade = TipoConteudo | TipoCompacto;

export type MinhaParticipacaoRole = "nenhuma" | "pendente" | "confirmado";

export type AlvoPost = {
  tipo: "post";
  id: string;
  fotoUrl: string;
  legenda: string;
  marca: { tipo: TipoMarcaPost; id: string; nome: string } | null;
};

export type AlvoTelemetria = {
  tipo: "telemetria";
  id: string;
  titulo: string;
  distanciaKm: number;
  tempoMovimentoSegundos: number;
  velocidadeMediaKmh: number;
  inicioNome: string;
  fimNome: string;
  tracadoResumo: string;
  medalhas: { conquistaId: string; nome: string; novidade: string }[];
};

export type AlvoRole = {
  tipo: "role";
  id: string;
  titulo: string;
  fotoCapaUrl: string;
  ritmo: RitmoRole;
  acesso: AcessoRole;
  dataHoraSaida: string;
  saidaNome: string;
  destinoNome: string;
  confirmados: number;
  jaSaiu: boolean;
  minhaParticipacao: MinhaParticipacaoRole;
  participantes?: { uid: string; fotoUrl: string }[];
};

export type AlvoEvento = {
  tipo: "evento";
  id: string;
  titulo: string;
  fotoCapaUrl: string;
  dataHoraAbertura: string;
  localNome: string;
  encerrado: boolean;
  inscrito: boolean;
  /** URL do álbum externo; presente em atividades album_evento. */
  albumUrl?: string | null;
};

export type AlvoAvaliacao = {
  tipo: "avaliacao";
  alvoTipo: "local" | "evento";
  alvoId: string;
  alvoNome: string;
  nota: number;
  comentario: string;
  fotosUrls: string[];
  recomendaComboio: boolean;
};

export type AlvoLocal = {
  tipo: "local";
  id: string;
  nome: string;
  categoria: CategoriaLocal;
};

export type AlvoAtividade =
  | AlvoPost
  | AlvoTelemetria
  | AlvoRole
  | AlvoEvento
  | AlvoAvaliacao
  | AlvoLocal;

export type ItemAtividade = {
  id: string;
  tipo: TipoAtividade;
  createdAt: string;
  autor: AutorPost;
  outrosAutores: AutorPost[];
  totalAutores: number;
  podeCurtir: boolean;
  curtidoPorMim: boolean;
  totalCurtidas: number;
  totalComentarios: number | null;
  alvo: AlvoAtividade;
};

export type PaginaFeedAmigos = {
  itens: ItemAtividade[];
  proximoCursor: string | null;
};

export type RespostaCurtida = {
  curtido: boolean;
  totalCurtidas: number;
};

export type ComentarioAtividade = ComentarioPost;
export type PaginaComentariosAtividade = PaginaPost<ComentarioAtividade>;

export const TIPOS_CONTEUDO: readonly TipoAtividade[] = [
  "foto",
  "telemetria",
  "role_criado",
  "role_realizado",
  "avaliacao_local",
  "avaliacao_evento",
  "album_evento",
];

export const ehConteudo = (tipo: TipoAtividade): boolean => TIPOS_CONTEUDO.includes(tipo);

export const idAtividadeFoto = (postId: string): string => `foto_${postId}`;
