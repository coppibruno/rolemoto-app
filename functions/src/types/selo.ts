import type {CategoriaLocal} from "./local";

/** Carimbo de um local único em que o piloto fez check-in. */
export type SeloPublico = {
  localId: string;
  nome: string;
  categoria: CategoriaLocal;
};
