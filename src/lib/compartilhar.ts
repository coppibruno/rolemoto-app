export type ResultadoCompartilhar =
  | "compartilhado"
  | "copiado"
  | "salvo"
  | "cancelado"
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

/** Abre o menu nativo com a imagem (Instagram, WhatsApp, etc.). */
export const compartilharArquivo = async (
  arquivo: File,
  texto: string,
): Promise<ResultadoCompartilhar> => {
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

  try {
    baixarArquivo(arquivo);
    return "salvo";
  } catch {
    return "erro";
  }
};
