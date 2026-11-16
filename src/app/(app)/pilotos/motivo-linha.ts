import type { LinhaSugestao } from "@/types/seguir";

/** A linha já mostra "Segue você" quando `segueVoce` é verdadeiro. */
export const textoMotivoLinha = (pessoa: LinhaSugestao): string | null => {
  if (pessoa.segueVoce && pessoa.motivo.tipo === "segue_voce") return null;
  return pessoa.motivo.texto;
};
