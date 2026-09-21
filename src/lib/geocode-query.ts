const STOPWORDS = new Set([
  "posto",
  "rua",
  "avenida",
  "de",
  "da",
  "do",
]);

export const normalizarQueryGeocode = (q: string): string =>
  q
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Remove stopwords genéricas (posto, rua, de…) para a 2ª passagem do Nominatim. */
export const tokensFortesGeocode = (q: string): string =>
  normalizarQueryGeocode(q)
    .split(" ")
    .filter((token) => token.length > 1 && !STOPWORDS.has(token))
    .join(" ");
