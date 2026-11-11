const CHAVE = "rolemoto:aviso-publicacao";

/** Recado de uma tela para a outra sem ir para a URL. Lido uma vez. */
export const guardarAvisoPublicacao = (mensagem: string): void => {
  try {
    window.sessionStorage.setItem(CHAVE, mensagem);
  } catch {
    // Sem sessionStorage o toast só não aparece.
  }
};

export const lerAvisoPublicacao = (): string | null => {
  try {
    const mensagem = window.sessionStorage.getItem(CHAVE);
    window.sessionStorage.removeItem(CHAVE);
    return mensagem;
  } catch {
    return null;
  }
};
