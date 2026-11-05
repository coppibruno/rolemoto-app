export type LinhaPiloto = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
  cidade: string;
  seguidoPorMim: boolean;
  segueVoce: boolean;
};

export type PaginaPilotos = {
  itens: LinhaPiloto[];
  proximoCursor: string | null;
};

export type RespostaBuscaPilotos = {
  itens: LinhaPiloto[];
};

export type AbaSeguir = "seguindo" | "seguidores";
