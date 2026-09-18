import type {
  UsuarioLocalFavorito,
  UsuarioLocalFavoritoCreate,
} from "../../types/favorito-local";

/**
 * Contrato de persistência do favorito usuário ↔ local (`userslocalfavorito`).
 */
export interface UsuarioLocalFavoritoRepository {
  buscarPorId(id: string): Promise<UsuarioLocalFavorito | null>;
  buscarPorUsuarioELocal(
    usuarioId: string,
    localId: string,
  ): Promise<UsuarioLocalFavorito | null>;
  criar(dados: UsuarioLocalFavoritoCreate): Promise<UsuarioLocalFavorito>;
  remover(id: string): Promise<boolean>;
  listarPorUsuario(usuarioId: string): Promise<UsuarioLocalFavorito[]>;
  listarLocalIdsPorUsuario(usuarioId: string): Promise<string[]>;
  contarPorUsuario(usuarioId: string): Promise<number>;
}
