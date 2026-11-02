import { describe, expect, it } from "vitest";
import { ESTILO_MAPA_ESCURO, ESTILO_MAPA_SELECAO } from "./google-maps";

type Regra = {
  featureType?: string;
  elementType?: string;
  stylers?: { visibility?: string }[];
};

const escondeLocais = (estilo: Record<string, unknown>[]): boolean =>
  (estilo as Regra[]).some(
    (regra) =>
      regra.featureType === "poi" &&
      regra.elementType === "labels" &&
      regra.stylers?.some((item) => item.visibility === "off"),
  );

describe("estilo do mapa", () => {
  it("esconde locais na ficha e na telemetria", () => {
    expect(escondeLocais(ESTILO_MAPA_ESCURO)).toBe(true);
  });

  it("mostra ícone e nome de posto, farmácia e mercado no cadastro", () => {
    expect(escondeLocais(ESTILO_MAPA_SELECAO)).toBe(false);
    const icone = (ESTILO_MAPA_SELECAO as Regra[]).find(
      (regra) => regra.featureType === "poi" && regra.elementType === "labels.icon",
    );
    expect(icone?.stylers?.some((item) => item.visibility === "on")).toBe(true);
  });
});
