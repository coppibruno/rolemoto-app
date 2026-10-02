import { describe, expect, it } from "vitest";
import { nomeArquivoShareTelemetria } from "./gerar-imagem-share";

describe("nomeArquivoShareTelemetria", () => {
  it("monta um png a partir do título", () => {
    expect(nomeArquivoShareTelemetria("Rolê · 02/10 14:30")).toBe(
      "role-02-10-14-30.png",
    );
  });

  it("usa um nome padrão quando o título não tem letras", () => {
    expect(nomeArquivoShareTelemetria("···")).toBe("telemetria.png");
  });
});