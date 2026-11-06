import {modeloDaClassificacao} from "../sugestoes-local/classificar-destino-moto";
import {erroDe, log} from "../log";
import {lerCartazInstagram, type CartazInstagram} from "./ler-cartaz-instagram";

const TIMEOUT_MS = 20000;

export class GeminiCotaError extends Error {
  constructor() {
    super("Cota do Gemini esgotada");
    this.name = "GeminiCotaError";
  }
}

type ImagemPost = {
  bytes: Buffer;
  contentType: string;
};

const textoDoPedido = (legenda: string): string =>
  [
    "Você lê um post público do Instagram.",
    "Marque eEvento true só se for encontro ou evento de moto",
    "com data marcada: encontro, track day, café de pilotos,",
    "exposição ou festa de motoclube.",
    "Foto de moto, rolê sem data, meme e anúncio de peça ficam com eEvento false.",
    "A data do post não é a abertura. Sem data futura no cartaz ou na legenda, eEvento false.",
    "abertura e encerramento em ISO 8601 com fuso de America/Sao_Paulo.",
    "tipo: moto_point_semanal, track_day, cafe_pilotos ou exposicao_custom.",
    "acesso: gratis ou ingresso.",
    "linkIngresso: null. O servidor lê a URL da legenda.",
    "Link na bio não é URL.",
    "lugar: nome e endereço em texto, ou vazio. cidade: cidade lida, ou vazio.",
    "uf: sigla do estado brasileiro onde o evento acontece (SC, PR, RS, MG, SP...),",
    "lida no cartaz, na legenda ou deduzida da cidade. Vazio se não der para saber.",
    "motivos: até 3 frases curtas. A primeira diz o que no cartaz levou a marcar como evento.",
    "titulo: até 80 caracteres.",
    "Responda só JSON com eEvento, titulo, abertura, encerramento, tipo,",
    "acesso, linkIngresso, lugar, cidade, uf e motivos.",
    "Legenda:",
    legenda || "(sem legenda)",
  ].join("\n");

const textoDaResposta = (bruto: unknown): string => {
  if (!bruto || typeof bruto !== "object") {
    return "";
  }
  const candidatos = (bruto as {candidates?: unknown}).candidates;
  if (!Array.isArray(candidatos) || !candidatos[0] || typeof candidatos[0] !== "object") {
    return "";
  }
  const parts = (candidatos[0] as {content?: {parts?: unknown}}).content?.parts;
  if (!Array.isArray(parts)) {
    return "";
  }
  return parts
    .map((parte) => {
      if (!parte || typeof parte !== "object") {
        return "";
      }
      const texto = (parte as {text?: unknown}).text;
      return typeof texto === "string" ? texto : "";
    })
    .join("");
};

const consultar = async (
  chave: string,
  legenda: string,
  imagem: ImagemPost | null,
): Promise<string> => {
  const parts: Array<Record<string, unknown>> = [{text: textoDoPedido(legenda)}];
  if (imagem && imagem.bytes.length > 0) {
    parts.push({
      inlineData: {
        mimeType: imagem.contentType,
        data: imagem.bytes.toString("base64"),
      },
    });
  }
  const modelo = modeloDaClassificacao(process.env.GEMINI_MODEL);
  let resposta: Response;
  try {
    resposta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": chave,
        },
        body: JSON.stringify({
          contents: [{role: "user", parts}],
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
  } catch (error) {
    log.warn("SugestaoEvento", "Leitura do post falhou", erroDe(error));
    return "";
  }
  const corpo: unknown = await resposta.json().catch(() => null);
  if (resposta.status === 429) {
    log.warn("SugestaoEvento", "Cota do Gemini esgotada", {modelo});
    throw new GeminiCotaError();
  }
  if (!resposta.ok) {
    log.warn("SugestaoEvento", "Leitura do post recusada", {
      modelo,
      status: resposta.status,
    });
    return "";
  }
  return textoDaResposta(corpo);
};

/** Uma chamada por post. Falha ou chave vazia devolve null e o post fica de fora. */
export const classificarPostInstagram = async (
  legenda: string,
  imagem: ImagemPost | null,
  agora: Date,
): Promise<CartazInstagram | null> => {
  const chave = (process.env.GEMINI_API_KEY ?? "").trim();
  if (!chave) {
    return null;
  }
  const texto = await consultar(chave, legenda.slice(0, 2000), imagem);
  if (!texto.trim()) {
    return null;
  }
  return lerCartazInstagram(texto, {agora, legenda});
};
