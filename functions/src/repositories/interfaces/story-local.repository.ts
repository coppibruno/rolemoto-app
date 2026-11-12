import type {
  ResultadoEncaminhar,
  StoryLocal,
  StoryLocalCreate,
  StoryVisto,
  StoryVistoGravacao,
} from "../../types/story-local";

export type StoryVinculoEvento = {
  id: string;
  marcaTipo: "local" | "evento" | null;
  marcaId: string | null;
};

/**
 * Persistência de stories (`userslocalstory`) e do visto por álbum.
 */
export interface StoryLocalRepository {
  criar(dados: StoryLocalCreate): Promise<StoryLocal>;
  buscarPorId(id: string): Promise<StoryLocal | null>;
  listarAtivasLocal(
    localId: string,
    agora: Date,
    limite: number,
  ): Promise<StoryLocal[]>;
  listarAtivasEvento(
    eventoId: string,
    agora: Date,
    limite: number,
  ): Promise<StoryLocal[]>;
  contarAtivasLocal(localId: string, agora: Date): Promise<number>;
  contarAtivasEvento(eventoId: string, agora: Date): Promise<number>;
  contarRecentesLocal(
    usuarioId: string,
    localId: string,
    desde: Date,
  ): Promise<number>;
  contarRecentesEvento(
    usuarioId: string,
    eventoId: string,
    desde: Date,
  ): Promise<number>;
  listarRecentesNaoExpiradas(agora: Date, limite: number): Promise<StoryLocal[]>;
  listarExpiradas(agora: Date, limite: number): Promise<StoryLocal[]>;
  listarPorUsuario(usuarioId: string, limite: number): Promise<StoryLocal[]>;
  listarPorCampo(
    campo: "localId" | "eventoId" | "marcaId",
    valor: string,
    limite: number,
  ): Promise<StoryLocal[]>;
  /** Tira o vínculo com o evento. Marca do evento no mesmo doc também sai. */
  soltarEvento(itens: StoryVinculoEvento[], eventoId: string): Promise<void>;
  soltarMarca(ids: string[]): Promise<void>;
  remover(id: string): Promise<void>;
  /** Cópias do post no ar deste uid (`expiresAt` > agora). */
  listarCopiasAtivas(
    usuarioId: string,
    postId: string,
    agora: Date,
  ): Promise<StoryLocal[]>;
  /** Na mesma transação: cópia no ar devolve a existente; teto de perfil recusa; senão cria. */
  encaminharPost(
    dados: StoryLocalCreate & {postId: string},
    tetoPerfil: number,
  ): Promise<ResultadoEncaminhar>;
  buscarVistos(ids: string[]): Promise<StoryVisto[]>;
  registrarVisto(dados: StoryVistoGravacao): Promise<void>;
}
