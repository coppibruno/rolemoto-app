export type TipoOfertaLocal = "preco" | "percentual" | "brinde";

/** Faixa do card no feed e no catálogo. Sem código. */
export type OfertaVigenteResumo = {
  id: string;
  titulo: string;
  rotulo: string;
  tetoDia: number | null;
  /** 0 = domingo … 6 = sábado. `[]` vale todos os dias. */
  dias: number[];
  horaInicio: string | null;
  horaFim: string | null;
};

/** `codigo` é `null` para o piloto quando a oferta não está no ar. */
export type OfertaLocal = OfertaVigenteResumo & {
  tipo: TipoOfertaLocal;
  valor: number | null;
  codigo: string | null;
  regra: string;
  ativa: boolean;
  vigente: boolean;
};

export type OfertaLocalDados = {
  titulo: string;
  tipo: TipoOfertaLocal;
  valor: number | null;
  codigo: string;
  regra: string;
  tetoDia: number | null;
  dias: number[];
  horaInicio: string | null;
  horaFim: string | null;
};

export type CupomOferta = {
  ofertaId: string;
  titulo: string;
  rotulo: string;
  regra: string;
  tetoDia: number | null;
  dias: number[];
  horaInicio: string | null;
  horaFim: string | null;
  codigo: string;
  piloto: { nome: string; moto: string };
  novo: boolean;
};

export type BalcaoLocal = {
  local: { id: string; nome: string };
  semana: { cuponsAbertos: number; checkins: number };
  ofertas: OfertaLocal[];
};

export type DonoLocal = { uid: string; nome: string };
