import type { OfertaVigenteResumo, TipoOfertaLocal } from "@/types/oferta-local";
import { DIAS_CURTOS } from "./rotulo-dia-semana";

const DIAS_LONGOS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

type Janela = Pick<OfertaVigenteResumo, "dias" | "horaInicio" | "horaFim" | "tetoDia">;

/** "17:00" → "17h"; "17:30" → "17h30". */
const horaCurta = (hora: string): string => {
  const [h, m] = hora.split(":");
  return m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}`;
};

/** Card: "até 17h", "até 20 por dia", os dois juntos, ou "hoje". */
export const janelaCurtaOferta = (oferta: Janela): string => {
  const partes: string[] = [];
  if (oferta.horaFim) partes.push(`até ${horaCurta(oferta.horaFim)}`);
  if (oferta.tetoDia) partes.push(`até ${oferta.tetoDia} por dia`);
  return partes.length > 0 ? partes.join(" · ") : "hoje";
};

const consecutivos = (dias: number[]): boolean =>
  dias.every((dia, i) => i === 0 || dia === dias[i - 1] + 1);

const textoDias = (dias: number[]): string | null => {
  if (dias.length === 0 || dias.length === 7) return null;
  const ordenados = [...dias].sort((a, b) => a - b);
  if (ordenados.length === 1) return DIAS_LONGOS[ordenados[0]];
  if (ordenados.length >= 3 && consecutivos(ordenados)) {
    const inicio = DIAS_CURTOS[ordenados[0]];
    const fim = DIAS_CURTOS[ordenados[ordenados.length - 1]].toLowerCase();
    return `${inicio}–${fim}`;
  }
  return ordenados.map((dia) => DIAS_CURTOS[dia]).join(", ");
};

/** Detalhe: "Quarta · 14:00–17:00", "Todo dia", "Seg–sex · o dia todo". */
export const janelaLongaOferta = (oferta: Janela): string => {
  const dias = textoDias(oferta.dias);
  const faixa =
    oferta.horaInicio && oferta.horaFim ? `${oferta.horaInicio}–${oferta.horaFim}` : null;
  if (!dias) return faixa ? `Todo dia · ${faixa}` : "Todo dia";
  return `${dias} · ${faixa ?? "o dia todo"}`;
};

export const LABELS_TIPO_OFERTA: Record<TipoOfertaLocal, string> = {
  preco: "Preço",
  percentual: "Percentual",
  brinde: "Brinde",
};

/** "32,50" ou "32.5" → 32.5; vazio ou inválido → null. */
export const lerValorOferta = (texto: string): number | null => {
  const limpo = texto.trim().replace(/\s/g, "").replace(/^R\$/i, "").replace(",", ".");
  if (!limpo) return null;
  const valor = Number(limpo);
  return Number.isFinite(valor) ? valor : null;
};

/** 32.5 → "32,50"; 32 → "32". */
export const escreverValorOferta = (tipo: TipoOfertaLocal, valor: number | null): string => {
  if (valor === null || tipo === "brinde") return "";
  if (tipo === "percentual" || Number.isInteger(valor)) return String(valor);
  return valor.toFixed(2).replace(".", ",");
};

export type CampoOferta =
  | "titulo"
  | "valor"
  | "codigo"
  | "regra"
  | "tetoDia"
  | "dias"
  | "faixa"
  | "geral";

/** Liga a mensagem da API ao campo do formulário. */
export const campoDoErroOferta = (mensagem: string): CampoOferta => {
  const texto = mensagem.toLowerCase();
  if (texto.includes("nome de até")) return "titulo";
  if (texto.includes("preço") || texto.includes("percentual") || texto.includes("brinde")) {
    return "valor";
  }
  if (texto.includes("código")) return "codigo";
  if (texto.includes("regra")) return "regra";
  if (texto.includes("teto")) return "tetoDia";
  if (texto.includes("dia inválido")) return "dias";
  if (texto.includes("horário") || texto.includes("início") || texto.includes("fim")) {
    return "faixa";
  }
  return "geral";
};
