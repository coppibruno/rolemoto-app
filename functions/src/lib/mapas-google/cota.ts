export const LIMITE_MAPAS_GOOGLE = 10_000;
export const AVISO_MAPAS_GOOGLE = 8_000;

export type ProvedorMapa = "google" | "osm";
export type MarcoMapaGoogle = "faixa" | "limite" | null;

export type EstadoCotaMapa = {
  periodo: string;
  cargas: number;
};

export type ResultadoReserva = {
  estado: EstadoCotaMapa;
  provedor: ProvedorMapa;
  marco: MarcoMapaGoogle;
  /** False quando o mês já está no teto: a transação não grava de novo. */
  gravar: boolean;
};

export const decidirCotaMapa = (cargas: number): {provedor: ProvedorMapa} => {
  if (cargas >= LIMITE_MAPAS_GOOGLE) return {provedor: "osm"};
  return {provedor: "google"};
};

/** Só no exato 8.000 e no exato 10.000, para o log sair uma vez por mês. */
export const marcoAdministrativo = (cargas: number): MarcoMapaGoogle => {
  if (cargas === AVISO_MAPAS_GOOGLE) return "faixa";
  if (cargas === LIMITE_MAPAS_GOOGLE) return "limite";
  return null;
};

export const mensagemMarco = (
  marco: Exclude<MarcoMapaGoogle, null>,
  periodo: string,
): string => {
  if (marco === "faixa") {
    return `Mapas Google: ${AVISO_MAPAS_GOOGLE} de ${LIMITE_MAPAS_GOOGLE}` +
      ` cargas no período ${periodo}.`;
  }
  return `Mapas Google: limite de ${LIMITE_MAPAS_GOOGLE} no período ${periodo}.` +
    " Próximas cargas usam o mapa livre.";
};

/**
 * Decide a próxima carga sem Firestore.
 * Mês diferente zera antes de incrementar. No teto não incrementa.
 */
export const aplicarReserva = (
  atual: EstadoCotaMapa | null,
  periodoCorrente: string,
): ResultadoReserva => {
  const mesmoMes = atual != null && atual.periodo === periodoCorrente;
  const cargasAtuais = mesmoMes ? atual.cargas : 0;

  if (cargasAtuais >= LIMITE_MAPAS_GOOGLE) {
    return {
      estado: {periodo: periodoCorrente, cargas: cargasAtuais},
      provedor: "osm",
      marco: null,
      gravar: false,
    };
  }

  const cargas = cargasAtuais + 1;
  return {
    estado: {periodo: periodoCorrente, cargas},
    provedor: decidirCotaMapa(cargas).provedor,
    marco: marcoAdministrativo(cargas),
    gravar: true,
  };
};
