import type {Dispositivo} from "../../types/dispositivo";

/**
 * Contrato de persistência de tokens FCM (coleção `dispositivos`).
 * Id do documento = o próprio token.
 */
export interface DispositivoRepository {
  upsert(uid: string, token: string): Promise<Dispositivo>;
  buscarPorToken(token: string): Promise<Dispositivo | null>;
  listarTokensPorUid(uid: string): Promise<string[]>;
  removerPorToken(token: string): Promise<boolean>;
  removerPorUid(uid: string): Promise<void>;
}
