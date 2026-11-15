import { describe, expect, it, vi } from "vitest";
import { FonteArquivoLocal } from "./fonte-arquivo-local";

const arquivo = Uint8Array.from({ length: 100 }, (_, i) => i);
const ler = async (fonte: FonteArquivoLocal, offset: number, length: number) =>
  Array.from(new Uint8Array((await fonte.getBytes(offset, length)).data));

describe("FonteArquivoLocal", () => {
  it("usa a faixa quando o servidor respeita o Range", async () => {
    const lerTudo = vi.fn(async () => arquivo);
    const fonte = new FonteArquivoLocal({
      chave: "a",
      buscarFaixa: async (inicio, fim) => new Response(arquivo.slice(inicio, fim + 1), { status: 206 }),
      lerTudo,
    });
    expect(await ler(fonte, 10, 3)).toEqual([10, 11, 12]);
    expect(lerTudo).not.toHaveBeenCalled();
  });

  it("206 com o arquivo inteiro (Android) vira cache e fatia pelo offset", async () => {
    const buscarFaixa = vi.fn(async () => new Response(arquivo, { status: 206 }));
    const fonte = new FonteArquivoLocal({ chave: "b", buscarFaixa, lerTudo: async () => arquivo });
    expect(await ler(fonte, 50, 2)).toEqual([50, 51]);
    expect(await ler(fonte, 98, 2)).toEqual([98, 99]);
    expect(buscarFaixa).toHaveBeenCalledTimes(1);
  });

  it("fetch bloqueado cai na leitura pelo plugin", async () => {
    const fonte = new FonteArquivoLocal({
      chave: "c",
      buscarFaixa: async () => {
        throw new TypeError("bloqueado");
      },
      lerTudo: async () => arquivo,
    });
    expect(await ler(fonte, 0, 4)).toEqual([0, 1, 2, 3]);
  });
});
