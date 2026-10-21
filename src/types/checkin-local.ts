import type { SeloPublico } from "./selo";

export type CheckinLocalResposta = {
  id: string;
  localId: string;
  createdAt: string;
  checkinProprio: true;
  seloNovo: SeloPublico | null;
  selos: SeloPublico[];
};
