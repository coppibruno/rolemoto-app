const EXTENSOES = new Set(["jpg", "jpeg", "png", "webp"]);

/** URL de download do Storage cujo objeto mora direto em `{prefixo}/`. */
export const validarFotoStory = (
  fotoUrl: unknown,
  prefixo: string,
): {ok: true; storagePath: string} | {ok: false} => {
  if (typeof fotoUrl !== "string" || !fotoUrl.trim()) {
    return {ok: false};
  }
  let url: URL;
  try {
    url = new URL(fotoUrl.trim());
  } catch {
    return {ok: false};
  }
  const emulator = process.env.FUNCTIONS_EMULATOR === "true";
  const esquemaOk = url.protocol === "https:" ||
    (emulator && url.protocol === "http:");
  if (!esquemaOk) {
    return {ok: false};
  }
  const marcador = "/o/";
  const indice = url.pathname.indexOf(marcador);
  if (indice < 0) {
    return {ok: false};
  }
  let caminho = url.pathname.slice(indice + marcador.length);
  try {
    caminho = decodeURIComponent(caminho);
  } catch {
    return {ok: false};
  }
  const base = `${prefixo}/`;
  if (!caminho.startsWith(base)) {
    return {ok: false};
  }
  const arquivo = caminho.slice(base.length);
  if (!arquivo || arquivo.includes("/") || arquivo.includes("..")) {
    return {ok: false};
  }
  if (!/^[\w.-]+$/.test(arquivo)) {
    return {ok: false};
  }
  const ext = arquivo.split(".").pop()?.toLowerCase() ?? "";
  if (!EXTENSOES.has(ext)) {
    return {ok: false};
  }
  return {ok: true, storagePath: caminho};
};
