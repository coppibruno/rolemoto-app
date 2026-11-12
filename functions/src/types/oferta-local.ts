export type TipoOfertaLocal = "preco" | "percentual" | "brinde";

/** Campos que o dono escreve (POST e PUT). */
export type OfertaLocalDados = {
  titulo: string;
  tipo: TipoOfertaLocal;
  valor: number | null;
  codigo: string;
  regra: string;
  tetoDia: number | null;
  /** 0 = domingo … 6 = sábado. `[]` vale todos os dias. */
  dias: number[];
  horaInicio: string | null;
  horaFim: string | null;
};

export type OfertaLocal = OfertaLocalDados & {
  id: string;
  localId: string;
  ativa: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Shape da API. `codigo` é `null` para o piloto quando a oferta não está no ar. */
export type OfertaLocalCliente = {
  id: string;
  titulo: string;
  tipo: TipoOfertaLocal;
  valor: number | null;
  rotulo: string;
  codigo: string | null;
  regra: string;
  tetoDia: number | null;
  dias: number[];
  horaInicio: string | null;
  horaFim: string | null;
  ativa: boolean;
  vigente: boolean;
};

/** Faixa do card no feed e no catálogo. Sem código. */
export type OfertaVigenteResumo = {
  id: string;
  titulo: string;
  rotulo: string;
  tetoDia: number | null;
  dias: number[];
  horaInicio: string | null;
  horaFim: string | null;
};

export type ResultadoCriarOferta =
  | {tipo: "criada"; oferta: OfertaLocal}
  | {tipo: "teto"}
  | {tipo: "codigo"};

export type ResultadoAtualizarOferta =
  | {tipo: "atualizada"; oferta: OfertaLocal}
  | {tipo: "ausente"}
  | {tipo: "codigo"};

export type UsuarioOfertaCupomCreate = {
  usuarioId: string;
  ofertaId: string;
  localId: string;
  /** `YYYY-MM-DD` em America/Sao_Paulo. */
  ymd: string;
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
  piloto: {nome: string; moto: string};
  novo: boolean;
};

export type BalcaoLocal = {
  local: {id: string; nome: string};
  semana: {cuponsAbertos: number; checkins: number};
  ofertas: OfertaLocalCliente[];
};
