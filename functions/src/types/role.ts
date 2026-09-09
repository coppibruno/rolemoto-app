export interface Localizacao {
  lat: number;
  lng: number;
  endereco: string;
}

export type CategoriaRole = "acelero" | "moderado" | "tranquilo";
export type CategoriaMotos = "ate300cc" | "acima600cc" | "todas";

/** Rolê de moto — sem tipos do Firebase. */
export interface Role {
  id: string;
  criadorId: string;
  dataHoraSaida: string;
  localSaida: Localizacao;
  destinoFinal: Localizacao;
  categoria: CategoriaRole;
  categoriaMotos: CategoriaMotos;
  fotoUrl: string;
  participantes: string[];
  createdAt: string;
}

export type RoleCreate = Omit<Role, "id" | "createdAt" | "participantes"> & {
  participantes?: string[];
};

export type RoleUpdate = Partial<Omit<RoleCreate, "criadorId">>;
