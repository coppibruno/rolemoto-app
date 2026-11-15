import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { base64ParaBytes } from "./base64";
import { FonteArquivoLocal } from "./fonte-arquivo-local";
import type { MetaPacote } from "./tipos";

export const PASTA_MAPAS = "mapas";
export const DIRETORIO = Directory.Data;

export const pastaDoPacote = (roleId: string): string => `${PASTA_MAPAS}/${roleId}`;
export const caminhoPmtiles = (roleId: string): string => `${pastaDoPacote(roleId)}/mapa.pmtiles`;
export const caminhoMeta = (roleId: string): string => `${pastaDoPacote(roleId)}/meta.json`;

export const lerMetaPacote = async (roleId: string): Promise<MetaPacote | null> => {
  try {
    const { data } = await Filesystem.readFile({
      path: caminhoMeta(roleId),
      directory: DIRETORIO,
      encoding: Encoding.UTF8,
    });
    return JSON.parse(String(data)) as MetaPacote;
  } catch {
    return null;
  }
};

export const apagarPasta = async (path: string): Promise<void> => {
  await Filesystem.rmdir({ path, directory: DIRETORIO, recursive: true }).catch(() => undefined);
};

export const apagarPacote = (roleId: string): Promise<void> => apagarPasta(pastaDoPacote(roleId));

export const fonteDoPacote = async (roleId: string): Promise<FonteArquivoLocal> => {
  const path = caminhoPmtiles(roleId);
  const { uri } = await Filesystem.getUri({ path, directory: DIRETORIO });
  const url = Capacitor.convertFileSrc(uri);
  return new FonteArquivoLocal({
    chave: `mapa-${roleId}-${Date.now()}`,
    buscarFaixa: (inicio, fim) => fetch(url, { headers: { Range: `bytes=${inicio}-${fim}` } }),
    lerTudo: async () => {
      const { data } = await Filesystem.readFile({ path, directory: DIRETORIO });
      return base64ParaBytes(String(data));
    },
  });
};
