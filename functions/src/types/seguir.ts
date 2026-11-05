export const LIMITE_BUSCA_PILOTOS = 20;
export const LIMITE_PAGINA_SEGUIR = 30;

/** Campos internos de `users`. Não saem no JSON público. */
export type CamposBusca = {
  nomeBusca: string;
  apelidoBusca: string;
  primeiroNomeBusca: string;
  ultimoNomeBusca: string;
};

/** `null` = chave ausente no doc antigo. */
export type CamposBuscaLidos = {
  nomeBusca: string | null;
  apelidoBusca: string | null;
  primeiroNomeBusca: string | null;
  ultimoNomeBusca: string | null;
};

export type PessoaBusca = CamposBusca & {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
  cidade: string;
};

export type VinculoSeguir = {
  id: string;
  seguidorId: string;
  seguidoId: string;
  createdAt: string;
};

export type LinhaPiloto = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
  cidade: string;
  seguidoPorMim: boolean;
  segueVoce: boolean;
};

export type PaginaLinhasPiloto = {
  itens: LinhaPiloto[];
  proximoCursor: string | null;
};

export type VinculoEntre = {
  seguidoPorMim: boolean;
  segueVoce: boolean;
};

export type PaginaVinculos =
  | {ok: true; vinculos: VinculoSeguir[]; proximoCursor: string | null}
  | {ok: false};

export type ResultadoSeguir =
  | "criado"
  | "existente"
  | "alvo_ausente"
  | "seguidor_ausente";

export type ResultadoDeixarSeguir = "removido" | "ausente";
