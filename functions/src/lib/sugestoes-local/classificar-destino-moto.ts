import { log } from "../log";
import { casaComRota, ehMirante } from "./nome-parecido";

export const TETO_CLASSIFICACAO = 24;
/** Flash cheio está sem capacidade ou é redirecionado para o 3.8. */
const MODELO_PADRAO = "gemini-3.5-flash-lite";
const MODELOS_SATURADOS = new Set([
  "gemini-2.5-flash",
  "gemini-3.5-flash",
  "gemini-3.7-flash",
  "gemini-3.8-flash",
]);
const TIMEOUT_MS = 15000;

export type ItemClassificacao = {
  placeId: string;
  nome: string;
  resumo: string;
  sementeNome: string;
  faceta: "turismo" | "mirante";
};

/** Só ponto turístico. Serra já reconhecida e mirante ficam de fora. */
export const selecionarParaIa = (
  itens: ItemClassificacao[],
): ItemClassificacao[] => {
  const vistos = new Set<string>();
  const escolhidos: ItemClassificacao[] = [];
  for (const item of itens) {
    if (item.faceta !== "turismo" || !item.placeId || vistos.has(item.placeId)) {
      continue;
    }
    if (ehMirante(item.nome) || casaComRota(item.nome, item.sementeNome)) {
      continue;
    }
    vistos.add(item.placeId);
    escolhidos.push(item);
    if (escolhidos.length >= TETO_CLASSIFICACAO) {
      break;
    }
  }
  return escolhidos;
};

export const lerAceitos = (
  texto: string,
  permitidos: Set<string>,
): Set<string> => {
  const limpo = texto
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  let bruto: unknown;
  try {
    bruto = JSON.parse(limpo);
  } catch {
    return new Set();
  }
  const lista = Array.isArray(bruto) ?
    bruto :
    bruto &&
        typeof bruto === "object" &&
        Array.isArray((bruto as { aceitos?: unknown }).aceitos) ?
      (bruto as { aceitos: unknown[] }).aceitos :
      [];
  const aceitos = new Set<string>();
  for (const item of lista) {
    if (typeof item === "string" && permitidos.has(item)) {
      aceitos.add(item);
    }
  }
  return aceitos;
};

const textoDoPedido = (itens: ItemClassificacao[]): string => {
  const linhas = itens.map((item) => {
    const resumo = item.resumo.replace(/\s+/g, " ").trim().slice(0, 180);
    return [
      `- id: ${item.placeId}`,
      `rota: ${item.sementeNome}`,
      `nome: ${item.nome}`,
      `resumo: ${resumo || "sem resumo"}`,
    ].join(" | ");
  });
  return [
    "Filtro ponto turístico: entre só a serra, o morro, o canyon ou a estrada do campo rota.",
    "Mirante é outro filtro. Nunca aceite mirante, belvedere, acesso ou fenda.",
    "Exemplos que entram: Serra do Rio do Rastro, Serra do Corvo Branco,",
    "Serra Dona Francisca, Morro da Igreja, Canyon Itaimbezinho.",
    "Ficam de fora: Mirante da Serra Dona Francisca, Mirante do Rio do Rastro,",
    "Acesso ao Morro da Igreja, restaurante, posto, pousada, guia, locadora,",
    "monumento e parque que só estão na região.",
    "Responda JSON {\"aceitos\":[\"id\"]}. Se nenhum for a própria rota, {\"aceitos\":[]}.",
    "Lugares:",
    ...linhas,
  ].join("\n");
};

/** Uma chamada. Modelo saturado ou vazio cai no Flash-Lite. */
export const modeloDaClassificacao = (modeloEnv: string | undefined): string => {
  const bruto = (modeloEnv ?? "").trim();
  if (!bruto || MODELOS_SATURADOS.has(bruto) || !/^[a-z0-9.-]+$/i.test(bruto)) {
    return MODELO_PADRAO;
  }
  return bruto;
};

class ConsultaGeminiError extends Error {
  constructor(readonly status: number | null) {
    super("gemini");
  }
}

const consultarGemini = async (
  modelo: string,
  chave: string,
  texto: string,
): Promise<unknown> => {
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
          contents: [{role: "user", parts: [{text: texto}]}],
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
  } catch {
    throw new ConsultaGeminiError(null);
  }
  const corpo: unknown = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new ConsultaGeminiError(resposta.status);
  }
  return corpo;
};

const textoDaResposta = (bruto: unknown): string => {
  if (!bruto || typeof bruto !== "object") {
    return "";
  }
  const candidatos = (bruto as { candidates?: unknown }).candidates;
  if (
    !Array.isArray(candidatos) ||
    !candidatos[0] ||
    typeof candidatos[0] !== "object"
  ) {
    return "";
  }
  const parts = (candidatos[0] as { content?: { parts?: unknown } }).content
    ?.parts;
  if (!Array.isArray(parts)) {
    return "";
  }
  return parts
    .map((parte) => {
      if (!parte || typeof parte !== "object") {
        return "";
      }
      const texto = (parte as { text?: unknown }).text;
      return typeof texto === "string" ? texto : "";
    })
    .join("");
};

export const classificarDestinosMoto = async (
  itens: ItemClassificacao[],
): Promise<Set<string>> => {
  const selecionados = selecionarParaIa(itens);
  if (selecionados.length === 0) {
    return new Set();
  }
  const chave = (process.env.GEMINI_API_KEY ?? "").trim();
  if (!chave) {
    log.info(
      "SugestaoLocal",
      "GEMINI_API_KEY vazia; mirante genérico fica de fora",
      {
        pendentes: selecionados.length,
      },
    );
    return new Set();
  }

  const permitidos = new Set(selecionados.map((item) => item.placeId));
  const texto = textoDoPedido(selecionados);
  const modelo = modeloDaClassificacao(process.env.GEMINI_MODEL);

  try {
    const corpo = await consultarGemini(modelo, chave, texto);
    const aceitos = lerAceitos(textoDaResposta(corpo), permitidos);
    log.info("SugestaoLocal", "IA classificou pontos turísticos", {
      modelo,
      enviados: selecionados.length,
      aceitos: aceitos.size,
    });
    return aceitos;
  } catch (error) {
    const status = error instanceof ConsultaGeminiError ? error.status : null;
    log.warn("SugestaoLocal", "IA de ponto turístico indisponível", {
      modelo,
      status,
    });
    return new Set();
  }
};
