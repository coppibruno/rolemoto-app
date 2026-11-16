import { describe, expect, it } from "vitest";
import { textoMotivoLinha } from "./motivo-linha";
import type { LinhaSugestao } from "@/types/seguir";

const pessoa = (extra: Partial<LinhaSugestao> = {}): LinhaSugestao => ({
  uid: "ana",
  nome: "Ana",
  apelido: "Ana",
  fotoUrl: "",
  cidade: "",
  seguidoPorMim: false,
  segueVoce: false,
  motivo: { tipo: "segue_voce", texto: "Segue você" },
  ...extra,
});

describe("texto do motivo na linha", () => {
  it("não repete Segue você quando a linha já mostra o vínculo", () => {
    expect(textoMotivoLinha(pessoa({ segueVoce: true }))).toBeNull();
    expect(
      textoMotivoLinha(
        pessoa({
          segueVoce: true,
          motivo: { tipo: "publicou", texto: "Publicou em Bar" },
        }),
      ),
    ).toBe("Publicou em Bar");
    expect(textoMotivoLinha(pessoa())).toBe("Segue você");
  });
});
