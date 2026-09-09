import { Timestamp } from "firebase/firestore";

export interface Localizacao {
  lat: number;
  lng: number;
  endereco: string;
}

export type CategoriaRole = "acelero" | "moderado" | "tranquilo";
export type CategoriaMotos = "ate300cc" | "acima600cc" | "todas";

export interface Role {
  id: string;
  criadorId: string;
  dataHoraSaida: Timestamp;
  localSaida: Localizacao;
  destinoFinal: Localizacao;
  categoria: CategoriaRole;
  categoriaMotos: CategoriaMotos;
  fotoUrl: string;
  participantes: string[];
  createdAt: Timestamp;
}

export type RoleForm = Omit<Role, "id" | "createdAt" | "participantes">;
