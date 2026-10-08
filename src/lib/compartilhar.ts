import {
  appNativo,
  compartilharImagemNativa,
  imagemNativaDisponivel,
  salvarImagemNativa,
} from "@/lib/compartilhar-imagem-nativo";

export type ResultadoCompartilhar =
  | "compartilhado"
  | "copiado"
  | "salvo"
  | "cancelado"
  | "desatualizado"
  | "erro";

type Payload = {
  title: string;
  text: string;
  url: string;
};

export const compartilharConteudo = async (
  payload: Payload,
): Promise<ResultadoCompartilhar> => {
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share(payload);
      return "compartilhado";
    }
  } catch (erro) {
    if (erro instanceof Error && erro.name === "AbortError") return "cancelado";
  }

  try {
    await navigator.clipboard.writeText(payload.url);
    return "copiado";
  } catch {
    const texto = `${payload.text} ${payload.url}`.trim();
    const wa = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
    const janela = window.open(wa, "_blank", "noopener,noreferrer");
    return janela ? "compartilhado" : "erro";
  }
};

const cancelouShare = (erro: unknown): boolean =>
  erro instanceof Error && erro.name === "AbortError";

const baixarArquivo = (arquivo: File) => {
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = arquivo.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
};

const compartilharNoNavegador = async (
  arquivo: File,
  texto: string,
): Promise<ResultadoCompartilhar | null> => {
  if (typeof navigator !== "undefined" && navigator.share) {
    const aceitaArquivo =
      !navigator.canShare || navigator.canShare({ files: [arquivo] });
    if (aceitaArquivo) {
      try {
        await navigator.share({ files: [arquivo], title: texto, text: texto });
        return "compartilhado";
      } catch (erro) {
        if (cancelouShare(erro)) return "cancelado";
        try {
          await navigator.share({ files: [arquivo] });
          return "compartilhado";
        } catch (erroArquivo) {
          if (cancelouShare(erroArquivo)) return "cancelado";
        }
      }
    }
  }
  return null;
};

const baixar = (arquivo: File): ResultadoCompartilhar => {
  try {
    baixarArquivo(arquivo);
    return "salvo";
  } catch {
    return "erro";
  }
};

/** Abre o menu nativo com a imagem (Instagram, WhatsApp, etc.). */
export const compartilharArquivo = async (
  arquivo: File,
  texto: string,
): Promise<ResultadoCompartilhar> => {
  if (imagemNativaDisponivel()) {
    try {
      await compartilharImagemNativa(arquivo, texto);
      return "compartilhado";
    } catch {
      return "erro";
    }
  }
  const resultado = await compartilharNoNavegador(arquivo, texto);
  if (resultado) return resultado;
  return appNativo() ? "desatualizado" : baixar(arquivo);
};

/** Galeria no Android; no navegador, download. No iOS o menu nativo traz "Salvar imagem". */
export const salvarArquivo = async (
  arquivo: File,
  texto: string,
): Promise<ResultadoCompartilhar> => {
  if (imagemNativaDisponivel()) {
    try {
      if (await salvarImagemNativa(arquivo)) return "salvo";
      await compartilharImagemNativa(arquivo, texto);
      return "compartilhado";
    } catch {
      return "erro";
    }
  }
  if (!appNativo()) return baixar(arquivo);
  const resultado = await compartilharNoNavegador(arquivo, texto);
  return resultado ?? "desatualizado";
};
