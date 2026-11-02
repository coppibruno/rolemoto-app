import { describe, expect, it } from "vitest";
import { ERRO_FOTO_GRANDE, MAX_FOTO_BYTES } from "@/lib/foto-limites";
import {
  ERRO_FOTO_FORMATO,
  contentTypeFotoAvaliacao,
  lerArquivosDoInput,
  selecionarArquivosFoto,
} from "./fotos-visita";

const arquivo = (nome: string, type: string, bytes = 8) =>
  new File([new Uint8Array(bytes)], nome, { type });

describe("lerArquivosDoInput", () => {
  it("guarda a foto antes do input limpar a lista", () => {
    const foto = arquivo("moto.jpg", "image/jpeg");
    const itens = [foto];
    const lista = {
      get length() {
        return itens.length;
      },
      item: (indice: number) => itens[indice] ?? null,
      [Symbol.iterator]: function* () {
        yield* itens;
      },
    } as FileList;

    const copia = lerArquivosDoInput(lista);
    itens.length = 0;

    expect(lerArquivosDoInput(lista)).toEqual([]);
    expect(copia).toEqual([foto]);
    expect(selecionarArquivosFoto(copia, 4).aceitos).toEqual([foto]);
  });
});

describe("selecionarArquivosFoto", () => {
  it("aceita jpg, png e tipo vazio com extensão", () => {
    const jpeg = arquivo("a.jpg", "image/jpeg");
    const jpg = arquivo("b.jpg", "image/jpg");
    const png = arquivo("c.png", "image/png");
    const semTipo = arquivo("d.JPEG", "");

    const { aceitos, erro } = selecionarArquivosFoto(
      [jpeg, jpg, png, semTipo],
      4,
    );

    expect(erro).toBeNull();
    expect(aceitos).toEqual([jpeg, jpg, png, semTipo]);
  });

  it("recusa formato e tamanho e respeita as vagas", () => {
    const jpeg = arquivo("a.jpg", "image/jpeg");
    const gif = arquivo("b.gif", "image/gif");
    const grande = arquivo("c.jpg", "image/jpeg", MAX_FOTO_BYTES + 1);
    const extra = arquivo("d.jpg", "image/jpeg");

    const formato = selecionarArquivosFoto([gif], 4);
    expect(formato.aceitos).toEqual([]);
    expect(formato.erro).toBe(ERRO_FOTO_FORMATO);

    const tamanho = selecionarArquivosFoto([grande, jpeg], 4);
    expect(tamanho.aceitos).toEqual([jpeg]);
    expect(tamanho.erro).toBe(ERRO_FOTO_GRANDE);

    const vagas = selecionarArquivosFoto([jpeg, extra], 1);
    expect(vagas.aceitos).toEqual([jpeg]);
  });
});

describe("contentTypeFotoAvaliacao", () => {
  it("grava png como png e o restante como jpeg", () => {
    expect(contentTypeFotoAvaliacao(arquivo("a.png", "image/png"))).toBe(
      "image/png",
    );
    expect(contentTypeFotoAvaliacao(arquivo("a.png", ""))).toBe("image/png");
    expect(contentTypeFotoAvaliacao(arquivo("a.jpg", "image/jpg"))).toBe(
      "image/jpeg",
    );
    expect(contentTypeFotoAvaliacao(arquivo("a.jpg", ""))).toBe("image/jpeg");
  });
});
