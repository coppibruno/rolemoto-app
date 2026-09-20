export type ResultadoCompartilhar = "compartilhado" | "copiado" | "cancelado" | "erro";

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
