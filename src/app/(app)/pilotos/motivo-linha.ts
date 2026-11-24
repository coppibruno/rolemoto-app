import type { LinhaSugestao } from "@/types/seguir";

/** A linha já mostra "Segue você" quando `segueVoce` é verdadeiro. */
export const textoMotivoLinha = (pessoa: LinhaSugestao): string | null => {
  if (pessoa.segueVoce && pessoa.motivo.tipo === "segue_voce") return null;
  // Telemetria traz a pessoa, mas sem frase no card.
  if (pessoa.motivo.tipo === "telemetria") return null;
  const texto = pessoa.motivo.texto.trim();
  return texto || null;
};
