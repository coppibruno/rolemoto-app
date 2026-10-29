export const FACETAS_BUSCA = [
  "restaurante",
  "padaria",
  "cafe",
  "mirante",
  "natureza",
] as const;

export type FacetaBusca = (typeof FACETAS_BUSCA)[number];

export type ConsultaBusca = {
  texto: string;
  faceta: FacetaBusca | null;
};

const TEXTO_FACETA: Record<FacetaBusca, string> = {
  restaurante: "restaurante",
  padaria: "padaria",
  cafe: "café",
  mirante: "mirante",
  natureza: "cachoeira",
};

const ehFaceta = (valor: string): valor is FacetaBusca =>
  (FACETAS_BUSCA as readonly string[]).includes(valor);

/** Sem `facetas` no body, liga as cinco. Lista vazia busca só moto e oficina. */
export const facetasDoPedido = (
  body: unknown,
): {ok: true; facetas: FacetaBusca[]} | {ok: false} => {
  if (!body || typeof body !== "object") {
    return {ok: true, facetas: [...FACETAS_BUSCA]};
  }
  const bruto = (body as {facetas?: unknown}).facetas;
  if (bruto === undefined) {
    return {ok: true, facetas: [...FACETAS_BUSCA]};
  }
  if (!Array.isArray(bruto)) {
    return {ok: false};
  }
  const facetas: FacetaBusca[] = [];
  for (const item of bruto) {
    if (typeof item !== "string" || !ehFaceta(item) || facetas.includes(item)) {
      return {ok: false};
    }
    facetas.push(item);
  }
  return {ok: true, facetas};
};

export const consultasDaRodada = (facetas: readonly FacetaBusca[]): ConsultaBusca[] => {
  const pedidas = new Set(facetas);
  const consultas: ConsultaBusca[] = [
    {texto: "ponto de encontro de motos", faceta: null},
    {texto: "oficina de motos", faceta: null},
  ];
  for (const faceta of FACETAS_BUSCA) {
    if (pedidas.has(faceta)) {
      consultas.push({texto: TEXTO_FACETA[faceta], faceta});
    }
  }
  return consultas;
};

export const rotuloFaceta = (faceta: FacetaBusca): string => {
  if (faceta === "cafe") {
    return "café";
  }
  return faceta;
};
