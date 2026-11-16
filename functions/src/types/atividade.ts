import type {AutorPost, ComentarioPublico, Pagina, TipoMarcaPost} from "./post-foto";
import type {NovidadeMedalha} from "./conquista";
import type {AcessoRole, RitmoRole} from "./role";
import type {CategoriaLocal} from "./local";

export const LIMITE_PAGINA_FEED_AMIGOS = 20;
export const LIMITE_NOVIDADES = 20;
export const LIMITE_PAGINA_COMENTARIOS_ATIVIDADE = 30;
export const MAX_AUTORES_FEED = 300;
export const TAMANHO_LOTE_AUTORES = 30;
export const MAX_PONTOS_TRACADO_RESUMO = 120;

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

export type AlvoTipoAtividade = "post" | "telemetria" | "role" | "evento" | "local";

/** Doc de `atividades`. Só ids: título, capa e data vêm da origem na leitura. */
export interface Atividade {
  id: string;
  tipo: TipoAtividade;
  autorId: string;
  alvoTipo: AlvoTipoAtividade;
  alvoId: string;
  refId: string;
  totalCurtidas: number;
  /** Tipo `foto` não usa: vale o do post. */
  totalComentarios: number;
  /** Hora da ação na origem. */
  createdAt: string;
}

export type AtividadeCreate = Omit<Atividade, "totalCurtidas" | "totalComentarios">;

export interface ComentarioAtividade {
  id: string;
  atividadeId: string;
  usuarioId: string;
  texto: string;
  createdAt: string;
}

export type ComentarioAtividadeCreate = Omit<ComentarioAtividade, "id" | "createdAt">;

export type ResultadoComentarAtividade =
  | {tipo: "criado"; comentario: ComentarioAtividade}
  | {tipo: "ausente"};

export type ResultadoCurtida =
  | {tipo: "ausente"}
  | {tipo: "ok"; mudou: boolean; totalCurtidas: number};

export type PaginaAtividades =
  | {ok: true; listas: Atividade[][]}
  | {ok: false};

export type MinhaParticipacaoRole = "nenhuma" | "pendente" | "confirmado";

export type AlvoRoleAtividade = {
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
  /** Só em `role_realizado`, até 5. */
  participantes?: {uid: string; fotoUrl: string}[];
};

export type AlvoAtividade =
  | {
    tipo: "post";
    id: string;
    fotoUrl: string;
    legenda: string;
    marca: {tipo: TipoMarcaPost; id: string; nome: string} | null;
  }
  | {
    tipo: "telemetria";
    id: string;
    titulo: string;
    distanciaKm: number;
    tempoMovimentoSegundos: number;
    velocidadeMediaKmh: number;
    inicioNome: string;
    fimNome: string;
    tracadoResumo: string;
    medalhas: {conquistaId: string; nome: string; novidade: NovidadeMedalha}[];
  }
  | AlvoRoleAtividade
  | {
    tipo: "evento";
    id: string;
    titulo: string;
    fotoCapaUrl: string;
    dataHoraAbertura: string;
    localNome: string;
    encerrado: boolean;
    inscrito: boolean;
  }
  | {
    tipo: "avaliacao";
    alvoTipo: "local" | "evento";
    alvoId: string;
    alvoNome: string;
    nota: number;
    comentario: string;
    fotosUrls: string[];
    recomendaComboio: boolean;
  }
  | {
    tipo: "local";
    id: string;
    nome: string;
    categoria: CategoriaLocal;
  };

export interface ItemAtividade {
  id: string;
  tipo: TipoAtividade;
  createdAt: string;
  autor: AutorPost;
  outrosAutores: AutorPost[];
  totalAutores: number;
  podeCurtir: boolean;
  curtidoPorMim: boolean;
  totalCurtidas: number;
  /** `null` nos compactos. */
  totalComentarios: number | null;
  alvo: AlvoAtividade;
}

export type PaginaFeedAmigos = {
  itens: ItemAtividade[];
  proximoCursor: string | null;
};

export type {ComentarioPublico, Pagina};
