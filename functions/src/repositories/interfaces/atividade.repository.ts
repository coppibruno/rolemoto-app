import type {
  AlvoTipoAtividade,
  Atividade,
  AtividadeCreate,
  ComentarioAtividade,
  ComentarioAtividadeCreate,
  PaginaAtividades,
  ResultadoComentarAtividade,
  ResultadoCurtida,
  TipoAtividade,
} from "../../types/atividade";
import type {Pagina} from "../../types/post-foto";

/**
 * Feed dos amigos: `atividades`, `atividadecurtida` e `atividadecomentario`.
 */
export interface AtividadeRepository {
  /** Só cria se o id não existe. `true` quando gravou. */
  registrar(dados: AtividadeCreate): Promise<boolean>;
  buscarPorId(id: string): Promise<Atividade | null>;
  /** Doc, curtidas e comentários. */
  remover(id: string): Promise<void>;
  /** Remove as atividades do alvo cujos tipos estão em `tipos`. */
  removerPorAlvo(
    alvoTipo: AlvoTipoAtividade,
    alvoId: string,
    tipos: TipoAtividade[],
  ): Promise<number>;
  /**
   * Uma consulta por lote (`autorId in lote`), `createdAt` desc e id desc,
   * depois do cursor. `ok: false` quando o cursor não existe.
   */
  paginaPorAutores(
    lotes: string[][],
    cursor: string | null,
    limitePorLote: number,
  ): Promise<PaginaAtividades>;
  /** Mais novas que `desdeId`, somadas por lote e cortadas em `limite`. 0 se o id não existe. */
  contarNovidades(lotes: string[][], desdeId: string, limite: number): Promise<number>;
  /** Ids, entre `atividadeIds`, que `usuarioId` curtiu. */
  curtidasDe(usuarioId: string, atividadeIds: string[]): Promise<Set<string>>;
  /** Com `criarSeAusente`, a atividade nasce na mesma transação da curtida. */
  curtir(
    usuarioId: string,
    atividadeId: string,
    criarSeAusente?: AtividadeCreate,
  ): Promise<ResultadoCurtida>;
  descurtir(usuarioId: string, atividadeId: string): Promise<ResultadoCurtida>;
  listarComentarios(
    atividadeId: string,
    cursor: string | null,
  ): Promise<Pagina<ComentarioAtividade>>;
  buscarComentario(id: string): Promise<ComentarioAtividade | null>;
  comentar(dados: ComentarioAtividadeCreate): Promise<ResultadoComentarAtividade>;
  apagarComentario(comentario: ComentarioAtividade): Promise<void>;
  /** Atividades do uid, e as curtidas e comentários dele nas dos outros. */
  limparPorUsuario(usuarioId: string): Promise<void>;
  /** Carga inicial: o que nasceu nas coleções de origem desde `desde`, sem selo. */
  listarOrigensDesde(desde: Date): Promise<AtividadeCreate[]>;
}
