export const FACETAS_BUSCA = [
  "turismo",
  "restaurante",
  "padaria",
  "cafe",
  "mirante",
  "natureza",
] as const;

export type FacetaBusca = (typeof FACETAS_BUSCA)[number];

/** Cron e tela: ponto turístico (serra) ligado, mirante desligado. */
export const FACETAS_PADRAO: FacetaBusca[] = FACETAS_BUSCA.filter(
  (faceta) => faceta !== "mirante",
);

export type ConsultaBusca = {
  texto: string;
  faceta: FacetaBusca | null;
  tipo?: string;
};

const TEXTO_FACETA: Partial<Record<FacetaBusca, string>> = {
  restaurante: "restaurante",
  padaria: "padaria",
  cafe: "café",
  mirante: "mirante",
  natureza: "cachoeira",
};

const ehFaceta = (valor: string): valor is FacetaBusca =>
  (FACETAS_BUSCA as readonly string[]).includes(valor);

/** Sem `facetas` no body, usa o padrão. Lista vazia busca só moto e oficina. */
export const facetasDoPedido = (
  body: unknown,
): {ok: true; facetas: FacetaBusca[]} | {ok: false} => {
  if (!body || typeof body !== "object") {
    return {ok: true, facetas: [...FACETAS_PADRAO]};
  }
  const bruto = (body as {facetas?: unknown}).facetas;
  if (bruto === undefined) {
    return {ok: true, facetas: [...FACETAS_PADRAO]};
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
    const texto = TEXTO_FACETA[faceta];
    if (texto && pedidas.has(faceta)) {
      consultas.push({texto, faceta});
    }
  }
  return consultas;
};

/** Ponto turístico busca a serra/rota. Mirante busca a palavra mirante. */
export const consultasDaSemente = (
  facetas: readonly FacetaBusca[],
  sementeNome: string,
  uf: string,
): ConsultaBusca[] => {
  const consultas = consultasDaRodada(facetas);
  if (facetas.includes("turismo")) {
    consultas.push({
      texto: `${sementeNome}, ${uf}`,
      faceta: "turismo",
    });
  }
  return consultas;
};

export const rotuloFaceta = (faceta: FacetaBusca): string => {
  if (faceta === "cafe") {
    return "café";
  }
  if (faceta === "turismo") {
    return "ponto turístico";
  }
  return faceta;
};
