import type {Afiliado} from "../../types/afiliado";

/** Links de afiliado. Sem delete: o histórico de números fica. */
export interface AfiliadoRepository {
  listar(): Promise<Afiliado[]>;
  criar(codigo: string, nome: string): Promise<Afiliado | null>;
  atualizarNome(codigo: string, nome: string): Promise<Afiliado | null>;
  /** `false` quando o código não existe. */
  registrarClique(codigo: string): Promise<boolean>;
  /**
   * Grava `users.afiliadoCodigo` e soma `contas` na mesma transação, só se o
   * código existe e o uid ainda não tem afiliado.
   */
  vincularConta(uid: string, codigo: string): Promise<boolean>;
}
