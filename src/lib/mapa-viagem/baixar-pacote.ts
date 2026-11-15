import { Encoding, Filesystem } from "@capacitor/filesystem";
import { PMTiles, findTile, zxyToTileId, type Header } from "pmtiles";
import type { Localizacao } from "@/types/role";
import { bytesParaBase64 } from "./base64";
import { buscarPostosECidades } from "./overpass";
import {
  DIRETORIO,
  PASTA_MAPAS,
  apagarPacote,
  apagarPasta,
  pastaDoPacote,
} from "./pacote-mapa";
import { concatenar, montarInicioArquivo, type EntradaTile } from "./pmtiles-escrita";
import type { MetaPacote } from "./tipos";
import {
  TETO_BYTES,
  ZOOM_PACOTE_MAX,
  ZOOM_PACOTE_MIN,
  corredorDaViagem,
  envelope,
  hashPontosViagem,
  tilesDoCorredor,
} from "./viagem";

export class ErroTrechoLongo extends Error {}

type Pedido = {
  roleId: string;
  titulo: string;
  dataHoraSaida: string;
  pontos: Localizacao[];
  urlSul: string;
  aoProgredir: (fracao: number) => void;
};

const LOTE = 12;
const PEDACO_DISCO = 2 * 1024 * 1024;
const PROFUNDIDADE_MAX = 3;

/** Bytes do tile como estão no arquivo do Sul, sem descomprimir. */
const bytesBrutos = async (
  origem: PMTiles,
  header: Header,
  tileId: number,
): Promise<Uint8Array | null> => {
  let offset = header.rootDirectoryOffset;
  let length = header.rootDirectoryLength;
  for (let nivel = 0; nivel <= PROFUNDIDADE_MAX; nivel++) {
    const diretorio = await origem.cache.getDirectory(origem.source, offset, length, header);
    const entrada = findTile(diretorio, tileId);
    if (!entrada) return null;
    if (entrada.runLength > 0) {
      const res = await origem.source.getBytes(
        header.tileDataOffset + entrada.offset,
        entrada.length,
        undefined,
        header.etag,
      );
      return new Uint8Array(res.data);
    }
    offset = header.leafDirectoryOffset + entrada.offset;
    length = entrada.length;
  }
  return null;
};

const metadadosDaOrigem = async (origem: PMTiles): Promise<Record<string, unknown>> => {
  try {
    const meta = (await origem.getMetadata()) as Record<string, unknown>;
    return { vector_layers: meta.vector_layers ?? [], attribution: "© OpenStreetMap" };
  } catch {
    return { attribution: "© OpenStreetMap" };
  }
};

/**
 * Grava em `mapas/{roleId}.tmp` e só no fim troca a pasta do rolê.
 * Passar de 120 MB apaga o temporário e mantém o pacote anterior.
 */
export const baixarPacote = async (pedido: Pedido): Promise<MetaPacote> => {
  const { roleId, pontos, aoProgredir } = pedido;
  const tmp = `${PASTA_MAPAS}/${roleId}.tmp`;
  const arquivo = `${tmp}/mapa.pmtiles`;
  await apagarPasta(tmp);
  await Filesystem.mkdir({ path: tmp, directory: DIRETORIO, recursive: true });

  try {
    const pernas = corredorDaViagem(pontos);
    const caixa = envelope(pernas);
    const lugares = buscarPostosECidades(pernas, pontos);
    const tiles = tilesDoCorredor(pernas)
      .map((t) => zxyToTileId(t.z, t.x, t.y))
      .sort((a, b) => a - b);

    const origem = new PMTiles(pedido.urlSul);
    const header = await origem.getHeader();
    const metadados = await metadadosDaOrigem(origem);

    const entradas: EntradaTile[] = [];
    let offset = 0;
    let partes = 0;
    let pendentes: Uint8Array[] = [];
    let pendentesBytes = 0;

    const descarregar = async () => {
      if (pendentesBytes === 0) return;
      await Filesystem.writeFile({
        path: `${tmp}/parte-${partes}.bin`,
        data: bytesParaBase64(concatenar(pendentes)),
        directory: DIRETORIO,
      });
      partes += 1;
      pendentes = [];
      pendentesBytes = 0;
    };

    for (let i = 0; i < tiles.length; i += LOTE) {
      const lote = tiles.slice(i, i + LOTE);
      const bytes = await Promise.all(lote.map((id) => bytesBrutos(origem, header, id)));
      lote.forEach((tileId, j) => {
        const conteudo = bytes[j];
        if (!conteudo || conteudo.length === 0) return;
        entradas.push({ tileId, offset, length: conteudo.length });
        offset += conteudo.length;
        pendentes.push(conteudo);
        pendentesBytes += conteudo.length;
      });
      if (offset > TETO_BYTES) throw new ErroTrechoLongo();
      if (pendentesBytes >= PEDACO_DISCO) await descarregar();
      aoProgredir(((i + lote.length) / tiles.length) * 0.9);
    }
    await descarregar();

    const inicio = montarInicioArquivo({
      entradas,
      tileCompression: header.tileCompression,
      tileType: header.tileType,
      minZoom: Math.max(ZOOM_PACOTE_MIN, header.minZoom),
      maxZoom: Math.min(ZOOM_PACOTE_MAX, header.maxZoom),
      limites: {
        minLon: caixa.lngMin,
        minLat: caixa.latMin,
        maxLon: caixa.lngMax,
        maxLat: caixa.latMax,
      },
      metadados,
    });
    const bytesTotal = inicio.length + offset;
    if (bytesTotal > TETO_BYTES) throw new ErroTrechoLongo();

    await Filesystem.writeFile({ path: arquivo, data: bytesParaBase64(inicio), directory: DIRETORIO });
    for (let p = 0; p < partes; p++) {
      const parte = `${tmp}/parte-${p}.bin`;
      const { data } = await Filesystem.readFile({ path: parte, directory: DIRETORIO });
      await Filesystem.appendFile({ path: arquivo, data: String(data), directory: DIRETORIO });
      await Filesystem.deleteFile({ path: parte, directory: DIRETORIO });
    }
    aoProgredir(0.95);

    const { postos, cidades } = await lugares;
    const meta: MetaPacote = {
      roleId,
      titulo: pedido.titulo,
      dataHoraSaida: pedido.dataHoraSaida,
      pontos,
      pontosHash: hashPontosViagem(pontos),
      baixadoEm: new Date().toISOString(),
      bytes: bytesTotal,
      postos,
      cidades,
      atribuicao: "© OpenStreetMap",
    };
    await Filesystem.writeFile({
      path: `${tmp}/meta.json`,
      data: JSON.stringify(meta),
      directory: DIRETORIO,
      encoding: Encoding.UTF8,
    });

    await apagarPacote(roleId);
    await Filesystem.rename({
      from: tmp,
      to: pastaDoPacote(roleId),
      directory: DIRETORIO,
      toDirectory: DIRETORIO,
    });
    aoProgredir(1);
    return meta;
  } catch (erro) {
    await apagarPasta(tmp);
    throw erro;
  }
};
