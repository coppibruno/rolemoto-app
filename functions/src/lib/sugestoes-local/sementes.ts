export type SementeLocal = {
  id: string;
  nome: string;
  uf: "SC" | "PR" | "RS";
  lat: number;
  lng: number;
  raioKm: number;
};

export const RAIO_SEMENTE_KM = 12;
export const SEMENTES_POR_RODADA = 4;
export const TETO_GRAVACOES = 8;

const semente = (
  id: string,
  nome: string,
  uf: SementeLocal["uf"],
  lat: number,
  lng: number,
): SementeLocal => ({
  id,
  nome,
  uf,
  lat,
  lng,
  raioKm: RAIO_SEMENTE_KM,
});

/** Centro da busca. O pin gravado é o do lugar, não este ponto. */
export const SEMENTES_LOCAIS: SementeLocal[] = [
  semente("rio-do-rastro", "Serra do Rio do Rastro", "SC", -28.399, -49.547),
  semente("dona-francisca", "Serra Dona Francisca", "SC", -26.220, -49.020),
  semente("corvo-branco", "Serra do Corvo Branco", "SC", -28.040, -49.370),
  semente("morro-da-igreja", "Morro da Igreja", "SC", -28.125, -49.480),
  semente("graciosa", "Estrada da Graciosa", "PR", -25.350, -48.880),
  semente("guartela", "Canyon Guartelá", "PR", -24.566, -50.257),
  semente("rota-romantica", "Rota Romântica", "RS", -29.374, -50.876),
  semente("itaimbezinho", "Canyon Itaimbezinho", "RS", -29.160, -50.080),
  semente("fortaleza", "Canyon Fortaleza", "RS", -29.070, -50.010),
  semente("rota-do-sol", "Rota do Sol", "RS", -29.400, -50.020),
];

export const fatiaSementes = (
  inicio: number,
  quantidade: number,
): {sementes: SementeLocal[]; proximoIndice: number} => {
  const total = SEMENTES_LOCAIS.length;
  const base = ((inicio % total) + total) % total;
  const sementes: SementeLocal[] = [];
  for (let i = 0; i < quantidade; i += 1) {
    sementes.push(SEMENTES_LOCAIS[(base + i) % total]);
  }
  return {sementes, proximoIndice: (base + quantidade) % total};
};
