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

export type TipoMotivoSugestao =
  | "segue_voce"
  | "seguido_por"
  | "organizou_role"
  | "telemetria"
  | "publicou";

export type MotivoSugestao = {
  tipo: TipoMotivoSugestao;
  texto: string;
};

export type LinhaSugestao = LinhaPiloto & {
  motivo: MotivoSugestao;
};

export type RespostaBuscaPilotos = {
  itens: LinhaPiloto[];
};

export type RespostaSugestoes = {
  itens: LinhaSugestao[];
};

export type AbaSeguir = "seguindo" | "seguidores";
