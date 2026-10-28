const ORIGEM_PUBLICA = "https://www.rolemoto.com.br";

/** App Links só verificam o www. O apex redireciona e o Android não abre o app. */
export const origemConvite = (): string => {
  if (typeof window === "undefined") return ORIGEM_PUBLICA;
  const host = window.location.hostname;
  if (host === "rolemoto.com.br" || host === "www.rolemoto.com.br") {
    return ORIGEM_PUBLICA;
  }
  return window.location.origin;
};
