import type {AgregadoCheckinUsuario} from "../../types/checkin-local";
import type {
  CamposBusca,
  CamposBuscaLidos,
  PessoaBusca,
} from "../../types/seguir";
import type {Usuario, UsuarioCreate, UsuarioUpdate} from "../../types/usuario";

/**
 * Contrato de persistência de usuários.
 * A implementação atual usa Firestore; trocar o adapter não altera as rotas.
 */
export interface UsuarioRepository {
  buscarPorId(uid: string): Promise<Usuario | null>;
  buscarPorIds(uids: string[]): Promise<Usuario[]>;
  buscarPorApelido(apelido: string): Promise<Usuario[]>;
  buscarAgregadoCheckin(uid: string): Promise<AgregadoCheckinUsuario | null>;
  salvarAgregadoCheckin(
    uid: string,
    dados: AgregadoCheckinUsuario,
  ): Promise<void>;
  criar(
    uid: string,
    dados: UsuarioCreate,
    busca: CamposBusca,
  ): Promise<Usuario>;
  atualizar(
    uid: string,
    dados: UsuarioUpdate,
    busca: CamposBusca,
  ): Promise<Usuario | null>;
  remover(uid: string): Promise<boolean>;
  lerCamposBusca(uid: string): Promise<CamposBuscaLidos | null>;
  gravarCamposBusca(uid: string, campos: CamposBusca): Promise<void>;
  buscarPorPrefixo(termo: string): Promise<PessoaBusca[]>;
}
