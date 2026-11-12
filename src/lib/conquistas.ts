import type { ConquistaConcedida, NovidadeMedalha } from "@/types/conquista";

export const MAX_CONQUISTAS_VISIVEIS = 4;

export const LABEL_NOVIDADE_MEDALHA: Record<NovidadeMedalha, string> = {
  primeira: "Primeira vez",
  recorde: "Recorde",
  passagem: "Passagem",
};

export const medalhaEmDestaque = (novidade: NovidadeMedalha): boolean =>
  novidade !== "passagem";

export const hrefRanking = (conquistaId: string): string =>
  `/ranking/${encodeURIComponent(conquistaId)}`;

/** `72 km/h` ou `72,5 km/h`: uma casa, vírgula, sem `,0`. */
export const formatarVelocidadeConquista = (kmh: number): string => {
  const umaCasa = Math.round(kmh * 10) / 10;
  const texto = Number.isInteger(umaCasa)
    ? String(umaCasa)
    : umaCasa.toFixed(1).replace(".", ",");
  return `${texto} km/h`;
};

export const fraseConquista = (conquista: ConquistaConcedida): string =>
  conquista.novidade === "primeira"
    ? `Você conquistou ${conquista.nome}`
    : `Recorde em ${conquista.nome}: ${formatarVelocidadeConquista(conquista.velocidadeMaxKmh)}`;
