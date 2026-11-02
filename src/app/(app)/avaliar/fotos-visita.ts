import { ERRO_FOTO_GRANDE, MAX_FOTO_BYTES } from "@/lib/foto-limites";

export const ERRO_FOTO_FORMATO = "Use JPG ou PNG.";

/** Copia na hora. `FileList` esvazia quando o input é limpo. */
export const lerArquivosDoInput = (lista: FileList | null): File[] =>
  lista ? Array.from(lista) : [];

const arquivoFotoAceito = (file: File): boolean => {
  if (
    file.type === "image/jpeg" ||
    file.type === "image/jpg" ||
    file.type === "image/png"
  ) {
    return true;
  }
  if (file.type !== "") return false;
  return /\.(jpe?g|png)$/i.test(file.name);
};

export const contentTypeFotoAvaliacao = (file: File): string => {
  if (file.type === "image/png") return "image/png";
  if (file.type === "" && file.name.toLowerCase().endsWith(".png")) {
    return "image/png";
  }
  return "image/jpeg";
};

export const selecionarArquivosFoto = (
  arquivos: readonly File[],
  vagas: number,
): { aceitos: File[]; erro: string | null } => {
  if (vagas <= 0 || arquivos.length === 0) {
    return { aceitos: [], erro: null };
  }

  const aceitos: File[] = [];
  let erro: string | null = null;

  for (const file of arquivos) {
    if (aceitos.length >= vagas) break;
    if (!arquivoFotoAceito(file)) {
      erro = ERRO_FOTO_FORMATO;
      continue;
    }
    if (file.size > MAX_FOTO_BYTES) {
      erro = ERRO_FOTO_GRANDE;
      continue;
    }
    aceitos.push(file);
  }

  return { aceitos, erro };
};
