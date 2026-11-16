import { describe, expect, it } from "vitest";
import {
  chaveCacheSugestao,
  guardarCacheSugestao,
  lerCacheSugestao,
  limparCacheSugestao,
  tirarUidDoCache,
} from "./cache-sugestoes";
import type { LinhaSugestao } from "@/types/seguir";

const linha = (uid: string): LinhaSugestao => ({
  uid,
  nome: uid,
  apelido: uid,
  fotoUrl: "",
  cidade: "",
  seguidoPorMim: false,
  segueVoce: false,
  motivo: { tipo: "segue_voce", texto: "Segue você" },
});

describe("cache de sugestões", () => {
  it("usa três casas e esquece depois de cinco minutos", () => {
    limparCacheSugestao();
    expect(chaveCacheSugestao(null, null)).toBe("sem");
    expect(chaveCacheSugestao(-26.9189, -49.0661)).toBe("-26.919,-49.066");
    const chave = chaveCacheSugestao(-26.9184, -49.0664);
    expect(chave).toBe("-26.918,-49.066");
    guardarCacheSugestao(chave, [linha("ana")], 1_000);
    expect(lerCacheSugestao(chave, 1_000 + 5 * 60 * 1000)?.map((item) => item.uid)).toEqual(["ana"]);
    expect(lerCacheSugestao(chave, 1_000 + 5 * 60 * 1000 + 1)).toBeNull();
  });

  it("seguir ou dispensar tira o uid de todas as chaves", () => {
    limparCacheSugestao();
    guardarCacheSugestao("sem", [linha("ana"), linha("bia")], 1_000);
    guardarCacheSugestao("1.000,2.000", [linha("ana")], 1_000);
    tirarUidDoCache("ana");
    expect(lerCacheSugestao("sem", 1_000)?.map((item) => item.uid)).toEqual(["bia"]);
    expect(lerCacheSugestao("1.000,2.000", 1_000)).toEqual([]);
  });
});
