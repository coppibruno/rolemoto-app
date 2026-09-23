import type {Dispositivo, PlataformaDispositivo} from "../../types/dispositivo";

/**
 * Contrato de persistência de tokens FCM (coleção `dispositivos`).
 * Id do documento = o próprio token.
 */
export interface DispositivoRepository {
  upsert(
    uid: string,
    token: string,
    plataforma?: PlataformaDispositivo,
  ): Promise<Dispositivo>;
  buscarPorToken(token: string): Promise<Dispositivo | null>;
  listarPorUid(uid: string): Promise<Dispositivo[]>;
  removerPorToken(token: string): Promise<boolean>;
  removerPorUid(uid: string): Promise<void>;
}
