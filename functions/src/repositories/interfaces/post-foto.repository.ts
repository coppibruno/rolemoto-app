import type {
  ComentarioPost,
  ComentarioPostCreate,
  Pagina,
  PostFoto,
  PostFotoCreate,
  ResultadoComentar,
} from "../../types/post-foto";

/**
 * Fotos do perfil (`userspostfoto`) e comentários (`userspostcomentario`).
 * As transações do teto, do comentário e da limpeza da conta ficam aqui.
 */
export interface PostFotoRepository {
  /** Conta os posts do uid desde `desde` e cria na mesma transação. `null` = teto. */
  criarDentroDoTeto(
    dados: PostFotoCreate,
    desde: Date,
    dentroDoTeto: (quantidade: number) => boolean,
  ): Promise<PostFoto | null>;
  buscarPorId(id: string): Promise<PostFoto | null>;
  buscarPorIds(ids: string[]): Promise<PostFoto[]>;
  listarPorUsuario(usuarioId: string, cursor: string | null): Promise<Pagina<PostFoto>>;
  /** Comentários em lotes de 100, depois o doc. O arquivo fica com quem chama. */
  remover(id: string): Promise<void>;
  listarComentarios(postId: string, cursor: string | null): Promise<Pagina<ComentarioPost>>;
  buscarComentario(id: string): Promise<ComentarioPost | null>;
  comentar(dados: ComentarioPostCreate): Promise<ResultadoComentar>;
  apagarComentario(comentario: ComentarioPost): Promise<void>;
  /**
   * Apaga posts e comentários do uid. Falha em um comentário vai para o log e segue.
   * Devolve os `storagePath` dos posts apagados.
   */
  limparPorUsuario(usuarioId: string): Promise<string[]>;
}
