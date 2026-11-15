/**
 * Gravador mínimo de PMTiles v3: cabeçalho + diretório raiz + metadados + folhas.
 * Os bytes dos tiles vêm depois, na ordem dos offsets das entradas.
 */

export type EntradaTile = {
  tileId: number;
  /** Relativo ao início da área de tiles. */
  offset: number;
  length: number;
};

export type OpcoesArquivo = {
  entradas: EntradaTile[];
  tileCompression: number;
  tileType: number;
  minZoom: number;
  maxZoom: number;
  limites: { minLon: number; minLat: number; maxLon: number; maxLat: number };
  metadados: Record<string, unknown>;
};

const TAMANHO_CABECALHO = 127;
/** O leitor busca 16 KB de uma vez: cabeçalho e raiz precisam caber aí. */
const LIMITE_RAIZ = 16384 - TAMANHO_CABECALHO;
const COMPRESSAO_NENHUMA = 1;

type EntradaDiretorio = EntradaTile & { runLength: number };

const escreverVarint = (saida: number[], valor: number) => {
  let v = valor;
  while (v >= 0x80) {
    saida.push((v % 0x80) | 0x80);
    v = Math.floor(v / 0x80);
  }
  saida.push(v);
};

export const serializarDiretorio = (entradas: EntradaDiretorio[]): Uint8Array => {
  const saida: number[] = [];
  escreverVarint(saida, entradas.length);
  let anterior = 0;
  for (const e of entradas) {
    escreverVarint(saida, e.tileId - anterior);
    anterior = e.tileId;
  }
  for (const e of entradas) escreverVarint(saida, e.runLength);
  for (const e of entradas) escreverVarint(saida, e.length);
  entradas.forEach((e, i) => {
    const anteriorE = entradas[i - 1];
    if (i > 0 && e.offset === anteriorE.offset + anteriorE.length) {
      escreverVarint(saida, 0);
    } else {
      escreverVarint(saida, e.offset + 1);
    }
  });
  return Uint8Array.from(saida);
};

const montarDiretorios = (
  entradas: EntradaDiretorio[],
): { raiz: Uint8Array; folhas: Uint8Array } => {
  const unica = serializarDiretorio(entradas);
  if (unica.length <= LIMITE_RAIZ) return { raiz: unica, folhas: new Uint8Array(0) };

  for (let porFolha = 4096; ; porFolha *= 2) {
    const partes: Uint8Array[] = [];
    const raizEntradas: EntradaDiretorio[] = [];
    let offset = 0;
    for (let i = 0; i < entradas.length; i += porFolha) {
      const fatia = entradas.slice(i, i + porFolha);
      const bytes = serializarDiretorio(fatia);
      raizEntradas.push({ tileId: fatia[0].tileId, offset, length: bytes.length, runLength: 0 });
      partes.push(bytes);
      offset += bytes.length;
    }
    const raiz = serializarDiretorio(raizEntradas);
    if (raiz.length <= LIMITE_RAIZ) return { raiz, folhas: concatenar(partes) };
  }
};

export const concatenar = (partes: Uint8Array[]): Uint8Array => {
  const total = partes.reduce((acc, p) => acc + p.length, 0);
  const saida = new Uint8Array(total);
  let pos = 0;
  for (const p of partes) {
    saida.set(p, pos);
    pos += p.length;
  }
  return saida;
};

const setUint64 = (view: DataView, pos: number, valor: number) => {
  view.setUint32(pos, valor % 2 ** 32, true);
  view.setUint32(pos + 4, Math.floor(valor / 2 ** 32), true);
};

/** Tudo o que vem antes dos tiles. Concatene os tiles em seguida, na ordem dos offsets. */
export const montarInicioArquivo = (opcoes: OpcoesArquivo): Uint8Array => {
  const entradas: EntradaDiretorio[] = [...opcoes.entradas]
    .sort((a, b) => a.tileId - b.tileId)
    .map((e) => ({ ...e, runLength: 1 }));
  const { raiz, folhas } = montarDiretorios(entradas);
  const metadados = new TextEncoder().encode(JSON.stringify(opcoes.metadados));

  const raizOffset = TAMANHO_CABECALHO;
  const metaOffset = raizOffset + raiz.length;
  const folhasOffset = metaOffset + metadados.length;
  const tilesOffset = folhasOffset + folhas.length;
  const tilesBytes = entradas.reduce((acc, e) => Math.max(acc, e.offset + e.length), 0);
  const ordenadoNoDisco = entradas.every(
    (e, i) => i === 0 || e.offset >= entradas[i - 1].offset + entradas[i - 1].length,
  );

  const cabecalho = new Uint8Array(TAMANHO_CABECALHO);
  const view = new DataView(cabecalho.buffer);
  cabecalho.set(new TextEncoder().encode("PMTiles"), 0);
  view.setUint8(7, 3);
  setUint64(view, 8, raizOffset);
  setUint64(view, 16, raiz.length);
  setUint64(view, 24, metaOffset);
  setUint64(view, 32, metadados.length);
  setUint64(view, 40, folhasOffset);
  setUint64(view, 48, folhas.length);
  setUint64(view, 56, tilesOffset);
  setUint64(view, 64, tilesBytes);
  setUint64(view, 72, entradas.length);
  setUint64(view, 80, entradas.length);
  setUint64(view, 88, entradas.length);
  view.setUint8(96, ordenadoNoDisco ? 1 : 0);
  view.setUint8(97, COMPRESSAO_NENHUMA);
  view.setUint8(98, opcoes.tileCompression);
  view.setUint8(99, opcoes.tileType);
  view.setUint8(100, opcoes.minZoom);
  view.setUint8(101, opcoes.maxZoom);
  const { minLon, minLat, maxLon, maxLat } = opcoes.limites;
  view.setInt32(102, Math.round(minLon * 1e7), true);
  view.setInt32(106, Math.round(minLat * 1e7), true);
  view.setInt32(110, Math.round(maxLon * 1e7), true);
  view.setInt32(114, Math.round(maxLat * 1e7), true);
  view.setUint8(118, opcoes.minZoom);
  view.setInt32(119, Math.round(((minLon + maxLon) / 2) * 1e7), true);
  view.setInt32(123, Math.round(((minLat + maxLat) / 2) * 1e7), true);

  return concatenar([cabecalho, raiz, metadados, folhas]);
};
