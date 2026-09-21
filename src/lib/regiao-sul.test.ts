import { describe, expect, it } from "vitest";
import {
  enderecoEstaNoSul,
  pontoEstaNoSul,
  sugestaoEstaNoSul,
} from "./regiao-sul";

describe("regiao-sul", () => {
  it("aceita Blumenau, Curitiba e Porto Alegre", () => {
    expect(pontoEstaNoSul(-26.9189, -49.0661)).toBe(true);
    expect(pontoEstaNoSul(-25.4284, -49.2733)).toBe(true);
    expect(pontoEstaNoSul(-30.0346, -51.2177)).toBe(true);
  });

  it("rejeita São Paulo, Rio e exterior", () => {
    expect(pontoEstaNoSul(-23.5505, -46.6333)).toBe(false);
    expect(pontoEstaNoSul(-22.9068, -43.1729)).toBe(false);
    expect(pontoEstaNoSul(40.4168, -3.7038)).toBe(false);
  });

  it("filtra UF pelo ISO e pelo nome do estado", () => {
    expect(enderecoEstaNoSul({ "ISO3166-2-lvl4": "BR-SC" })).toBe(true);
    expect(enderecoEstaNoSul({ state: "Paraná" })).toBe(true);
    expect(enderecoEstaNoSul({ state: "São Paulo" })).toBe(false);
    expect(enderecoEstaNoSul({ "ISO3166-2-lvl4": "BR-SP" })).toBe(false);
  });

  it("cai no bbox quando o Nominatim não manda estado", () => {
    expect(sugestaoEstaNoSul(undefined, -26.9, -49.06)).toBe(true);
    expect(sugestaoEstaNoSul({}, -23.55, -46.63)).toBe(false);
  });
});
