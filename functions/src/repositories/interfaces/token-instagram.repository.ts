import type {TokenInstagramGuardado} from "../../lib/sugestoes-evento/renovacao-token-instagram";

export type {TokenInstagramGuardado};

/**
 * Token vigente da conta @rolemotobr.
 * O client não lê esta coleção. A env guarda só a semente.
 */
export interface TokenInstagramRepository {
  ler(): Promise<TokenInstagramGuardado | null>;
  salvar(token: TokenInstagramGuardado): Promise<void>;
}
