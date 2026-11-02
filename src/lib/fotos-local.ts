import {
  ERRO_FOTO_GRANDE,
  MAX_FOTO_BYTES,
  TIPOS_FOTO_ACEITOS,
} from "./foto-limites";

export const LIMITE_FOTOS_LOCAL = 5;
export const ERRO_FOTO_FORMATO = "Use JPG ou PNG de até 10 MB";
export const ERRO_LIMITE_FOTOS = `Máximo de ${LIMITE_FOTOS_LOCAL} fotos`;

const arquivoAceito = (file: File): boolean => {
  if (TIPOS_FOTO_ACEITOS.includes(file.type)) return true;
  if (file.type !== "") return false;
  return /\.(jpe?g|png)$/i.test(file.name);
};

/** Preenche as vagas que ainda cabem no limite de 5. */
export const selecionarFotosLocal = (
  arquivos: readonly File[],
  jaTem: number,
): { aceitas: File[]; erro?: string } => {
  const vagas = LIMITE_FOTOS_LOCAL - jaTem;
  if (vagas <= 0) return { aceitas: [], erro: ERRO_LIMITE_FOTOS };

  const aceitas: File[] = [];
  let erro: string | undefined;

  for (const file of arquivos) {
    if (aceitas.length >= vagas) {
      erro = ERRO_LIMITE_FOTOS;
      break;
    }
    if (!arquivoAceito(file)) {
      erro = ERRO_FOTO_FORMATO;
      continue;
    }
    if (file.size > MAX_FOTO_BYTES) {
      erro = ERRO_FOTO_GRANDE;
      continue;
    }
    aceitas.push(file);
  }

  return { aceitas, erro };
};

/** Galeria do detalhe. Sem a lista, a capa antiga ocupa o único slide. */
export const fotosDoLocal = (local: {
  fotoFachadaUrl?: string | null;
  fotosUrls?: readonly string[] | null;
}): string[] => {
  const lista = (local.fotosUrls ?? [])
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, LIMITE_FOTOS_LOCAL);
  if (lista.length > 0) return [...new Set(lista)];
  const capa = local.fotoFachadaUrl?.trim() ?? "";
  return capa ? [capa] : [];
};
