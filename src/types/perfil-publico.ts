import type { ItemHistoricoPista, ItemHistoricoRole } from "./historico-pistas";
import type { ConquistaPerfil } from "./conquista";
import type { SeloPublico } from "./selo";
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
  selos: SeloPublico[];
  /** Público: só id e nome. No próprio `/perfil`, também a velocidade. */
  conquistas?: ConquistaPerfil[];
  seguindo: number;
  seguidores: number;
  /** Só no perfil de outra pessoa. Ausente no próprio GET /perfil. */
  seguidoPorMim?: boolean;
  segueVoce?: boolean;
};

export type AbaHistoricoPublico = "concluidos" | "comoLider";

export type HistoricoPublico = {
  concluidos: ItemHistoricoPista[];
  comoLider: ItemHistoricoRole[];
  contagens: {
    concluidos: number;
    comoLider: number;
  };
};
