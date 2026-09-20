import { describe, expect, it } from "vitest";
import { destinoSeguro } from "./destino-pos-auth";

describe("destinoSeguro", () => {
  it("preserva detalhe de evento e local", () => {
    expect(destinoSeguro("/eventos/abc123")).toBe("/eventos/abc123");
    expect(destinoSeguro("/locais/xyz789")).toBe("/locais/xyz789");
  });

  it("rejeita destino inseguro", () => {
    expect(destinoSeguro("https://evil.example")).toBe("/");
    expect(destinoSeguro("/admin")).toBe("/");
  });
});
