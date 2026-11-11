import type {
  ResultadoEncaminhar,
  StoryLocal,
  StoryLocalCreate,
  StoryVisto,
  StoryVistoGravacao,
} from "../../types/story-local";

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
