import { describe, expect, it } from "vitest";
import { nomeBolhaStory, rotuloBolhaStory } from "./pessoas-story";

describe("bolha de story", () => {
  it("chama a própria de Seu story", () => {
    const pessoa = { propria: true, apelido: "Nega", naoVisto: false };
    expect(nomeBolhaStory(pessoa)).toBe("Seu story");
    expect(rotuloBolhaStory(pessoa)).toBe("Seu story");
  });

  it("diferencia ver e rever pelo anel", () => {
    const nova = { propria: false, apelido: "Boca", naoVisto: true };
    const vista = { propria: false, apelido: "Boca", naoVisto: false };
    expect(nomeBolhaStory(nova)).toBe("Boca");
    expect(rotuloBolhaStory(nova)).toBe("Stories de Boca");
    expect(rotuloBolhaStory(vista)).toBe("Rever stories de Boca");
  });
});
