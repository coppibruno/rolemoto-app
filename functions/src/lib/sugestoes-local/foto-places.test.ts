import {describe, expect, it} from "vitest";
import {fotoDoLugar, recursoFotoValido} from "./foto-places";

describe("fotoDoLugar", () => {
  it("guarda o recurso e o crédito da primeira foto", () => {
    const foto = fotoDoLugar([
      {
        name: "places/ChIJteste/photos/AbCdEfGh",
        authorAttributions: [{displayName: "Ana"}],
      },
    ]);
    expect(foto.recurso).toBe("places/ChIJteste/photos/AbCdEfGh");
    expect(foto.atribuicao).toBe("Ana");
    expect(recursoFotoValido(foto.recurso)).toBe(true);
  });

  it("descarta recurso que não é da Places", () => {
    const foto = fotoDoLugar([{name: "https://evil.example/foto"}]);
    expect(foto.recurso).toBe("");
    expect(foto.atribuicao).toBe("");
  });

  it("usa Google quando a foto não traz autor", () => {
    const foto = fotoDoLugar([{name: "places/ChIJteste/photos/AbCdEfGh"}]);
    expect(foto.atribuicao).toBe("Google");
  });
});
