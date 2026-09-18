import type { ItemHistoricoPista } from "./historico-pistas";
import type { Pilotagem, TipoMoto } from "./user";

export type PerfilPublico = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
  moto: string;
  tipoMoto: TipoMoto | null;
  pilotagem: Pilotagem;
  cidade: string;
  garupaFrequente: boolean;
};

export type AbaHistoricoPublico = "concluidos" | "comoLider";

export type HistoricoPublico = {
  concluidos: ItemHistoricoPista[];
  comoLider: ItemHistoricoPista[];
  contagens: {
    concluidos: number;
    comoLider: number;
  };
};
