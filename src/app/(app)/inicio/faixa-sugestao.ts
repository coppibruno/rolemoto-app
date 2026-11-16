const CHAVE = "rolemoto.sugestoes.faixa";

type Memoria = Pick<Storage, "getItem" | "setItem">;

const memoriaPadrao = (): Memoria | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage;
};

export const ymdSaoPauloAgora = (data = new Date()): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(data);

export const faixaOcultaHoje = (ymd: string, storage: Memoria | null = memoriaPadrao()): boolean =>
  storage?.getItem(CHAVE) === ymd;

export const ocultarFaixaHoje = (ymd: string, storage: Memoria | null = memoriaPadrao()) => {
  storage?.setItem(CHAVE, ymd);
};
