import { describe, expect, it } from "vitest";
import { normalizarQueryGeocode, tokensFortesGeocode } from "./geocode-query";

describe("geocode-query", () => {
  it("normaliza acentos e espaços", () => {
    expect(normalizarQueryGeocode("  Vila  Nova,  Blumenau ")).toBe(
      "vila nova blumenau",
    );
  });

  it("remove stopwords no fallback (caso Blumenau / G3)", () => {
    expect(tokensFortesGeocode("posto petrobras vila nova")).toBe(
      "petrobras vila nova",
    );
    expect(tokensFortesGeocode("almirante vila nova")).toBe(
      "almirante vila nova",
    );
    expect(tokensFortesGeocode("rua das palmeiras")).toBe("palmeiras");
  });
});
