import { describe, expect, it } from "vitest";
import { limitarPosicao, mesclarStories, ordenarStories } from "./marca-story";

const foto = (id: string, createdAt: string) => ({ id, createdAt });

describe("marca do story", () => {
  it("mantém a marca dentro da foto", () => {
    expect(limitarPosicao(-10, 200)).toEqual({ x: 12, y: 76 });
    expect(limitarPosicao(40.26, 55.24)).toEqual({ x: 40.3, y: 55.2 });
  });

  it("ordena pela hora, com ou sem marca", () => {
    const lista = ordenarStories([
      foto("sem-marca", "2026-10-22T15:00:00.000Z"),
      foto("com-marca", "2026-10-22T14:00:00.000Z"),
      foto("outra", "2026-10-22T15:00:00.000Z"),
    ]);
    expect(lista.map((item) => item.id)).toEqual(["com-marca", "outra", "sem-marca"]);
  });

  it("encaixa a foto recém-publicada no lugar da hora", () => {
    const lista = mesclarStories(
      [foto("antes", "2026-10-22T14:00:00.000Z"), foto("depois", "2026-10-22T16:00:00.000Z")],
      foto("nova", "2026-10-22T15:00:00.000Z"),
    );
    expect(lista.map((item) => item.id)).toEqual(["antes", "nova", "depois"]);
  });
});
