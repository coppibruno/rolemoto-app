import type {Local, LocalCreate} from "../../types/local";
import type {
  FotoSugestaoGravada,
  StatusSugestaoLocal,
  SugestaoLocal,
  SugestaoLocalNova,
} from "../../types/sugestao-local";

export interface SugestaoLocalRepository {
  listarPorStatus(status: StatusSugestaoLocal): Promise<SugestaoLocal[]>;
  listarIds(): Promise<string[]>;
  buscarPorId(id: string): Promise<SugestaoLocal | null>;
  /** `false` quando o `placeId` já estava na fila. */
  criar(dados: SugestaoLocalNova): Promise<boolean>;
  gravarFoto(id: string, foto: FotoSugestaoGravada): Promise<void>;
  aprovar(id: string, dados: LocalCreate): Promise<Local>;
  recusar(id: string): Promise<void>;
  lerProximoIndice(): Promise<number>;
  gravarProximoIndice(indice: number): Promise<void>;
}
