import type { RangeResponse, Source } from "pmtiles";

type Dependencias = {
  chave: string;
  /** `fetch` com Range na URL local do arquivo. */
  buscarFaixa: (inicio: number, fim: number) => Promise<Response>;
  /** Último recurso: arquivo inteiro pelo plugin de arquivos. */
  lerTudo: () => Promise<Uint8Array>;
};

/**
 * Lê o `mapa.pmtiles` do aparelho. O servidor local do Android responde 206
 * com o arquivo inteiro desde o byte 0, então corpo maior que o pedido vira cache
 * do arquivo todo e as leituras seguintes só fatiam.
 */
export class FonteArquivoLocal implements Source {
  private inteiro: Promise<Uint8Array> | null = null;
  private faixaFunciona = true;

  constructor(private readonly deps: Dependencias) {}

  getKey(): string {
    return this.deps.chave;
  }

  async getBytes(offset: number, length: number): Promise<RangeResponse> {
    if (this.faixaFunciona && !this.inteiro) {
      try {
        const res = await this.deps.buscarFaixa(offset, offset + length - 1);
        const corpo = new Uint8Array(await res.arrayBuffer());
        if (res.ok && corpo.length === length) return { data: fatiar(corpo, 0, length) };
        if (res.ok && corpo.length > length) {
          this.inteiro = Promise.resolve(corpo);
        } else {
          this.faixaFunciona = false;
        }
      } catch {
        this.faixaFunciona = false;
      }
    }
    if (!this.inteiro) this.inteiro = this.deps.lerTudo();
    const tudo = await this.inteiro;
    return { data: fatiar(tudo, offset, offset + length) };
  }
}

const fatiar = (bytes: Uint8Array, inicio: number, fim: number): ArrayBuffer =>
  bytes.slice(inicio, fim).buffer as ArrayBuffer;
