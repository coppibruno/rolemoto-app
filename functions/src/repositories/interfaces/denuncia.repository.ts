import type {
  Denuncia,
  DenunciaCreate,
  ResultadoDenunciar,
} from "../../types/moderacao";

/**
 * Denúncia de UGC (`usersdenuncia`). Id auto.
 * Dedupe 24 h por `(denuncianteId, alvoTipo, alvoId)`.
 */
export interface DenunciaRepository {
  criar(dados: DenunciaCreate): Promise<ResultadoDenunciar>;
  buscarRecente(
    denuncianteId: string,
    alvoTipo: Denuncia["alvoTipo"],
    alvoId: string,
  ): Promise<Denuncia | null>;
  limparPorUsuario(uid: string): Promise<void>;
}
