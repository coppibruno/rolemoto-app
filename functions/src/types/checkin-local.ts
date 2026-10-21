import type {CategoriaLocal} from "./local";
import type {SeloPublico} from "./selo";

export type UsuarioLocalCheckin = {
  id: string;
  usuarioId: string;
  localId: string;
  lat: number;
  lng: number;
  createdAt: string;
};

export type UsuarioLocalCheckinCreate = {
  usuarioId: string;
  localId: string;
  lat: number;
  lng: number;
};

export type CheckinsPorCategoria = Record<CategoriaLocal, number>;

export type AgregadoCheckinUsuario = {
  locaisVisitadosUnicos: number;
  locaisVisitadosIds: string[];
  checkinsPorCategoria: CheckinsPorCategoria;
  selos: SeloPublico[];
};

export type CheckinLocalResposta = {
  id: string;
  localId: string;
  createdAt: string;
  checkinProprio: true;
  seloNovo: SeloPublico | null;
  selos: SeloPublico[];
};
