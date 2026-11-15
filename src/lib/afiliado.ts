const CHAVE = "rolemoto.afiliado";
const CHAVE_CLIQUE = "rolemoto.afiliado.clique";
const VALIDADE_MS = 30 * 24 * 60 * 60 * 1000;
const FORMATO = /^[a-z0-9-]{3,20}$/;

type Guardado = { codigo: string; ts: number };

export const URL_SITE_AFILIADO = "https://www.rolemoto.com.br";

export const linkAfiliado = (codigo: string) => `${URL_SITE_AFILIADO}/i/${codigo}`;

export const normalizarCodigoAfiliado = (valor: string): string | null => {
  const codigo = valor.trim().toLowerCase();
  return FORMATO.test(codigo) ? codigo : null;
};

const ler = (chave: string): unknown => {
  try {
    const bruto = window.localStorage.getItem(chave);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
};

const gravar = (chave: string, valor: unknown) => {
  try {
    window.localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // modo privado ou cota cheia: segue sem afiliado
  }
};

export const guardarCodigoAfiliado = (codigo: string, agora = Date.now()) => {
  gravar(CHAVE, { codigo, ts: agora } satisfies Guardado);
};

/** Código guardado há menos de 30 dias; senão `null`. */
export const codigoAfiliadoValido = (agora = Date.now()): string | null => {
  const guardado = ler(CHAVE) as Partial<Guardado> | null;
  if (!guardado || typeof guardado.codigo !== "string" || typeof guardado.ts !== "number") {
    return null;
  }
  if (agora - guardado.ts > VALIDADE_MS) return null;
  return normalizarCodigoAfiliado(guardado.codigo);
};

export const limparCodigoAfiliado = () => {
  try {
    window.localStorage.removeItem(CHAVE);
  } catch {
    // nada a limpar
  }
};

const ymdLocal = (agora: number) => {
  const data = new Date(agora);
  return `${data.getFullYear()}-${data.getMonth() + 1}-${data.getDate()}`;
};

export const cliqueJaContadoHoje = (codigo: string, agora = Date.now()): boolean => {
  const marca = ler(CHAVE_CLIQUE) as { codigo?: string; ymd?: string } | null;
  return marca?.codigo === codigo && marca.ymd === ymdLocal(agora);
};

export const marcarCliqueHoje = (codigo: string, agora = Date.now()) => {
  gravar(CHAVE_CLIQUE, { codigo, ymd: ymdLocal(agora) });
};
