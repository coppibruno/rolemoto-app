import type { RitmoRole } from "@/types/role";

export const COPY_BANNER =
  "Você recebeu este convite via WhatsApp. Conheça os detalhes do comboio e garanta sua vaga antes que esgote!";

export const COPY_COMPARTILHAR = "Compartilhar Convite com Pilotos";
export const COPY_VAGAS = "Vagas abertas para novos participantes";
export const COPY_ENCERRADO = "Este rolê já aconteceu";
export const COPY_MICROCOPY =
  "Necessário aprovação do organizador para garantir a vaga no rolê";
export const COPY_PRIMEIRO_PILOTO = "Seja o primeiro piloto";
export const COPY_CTA = "Participar do Rolê";
export const COPY_CTA_SUB = "Solicitar entrada no comboio";
export const COPY_GERENCIAR = "Gerenciar rolê";
export const COPY_LINK_COPIADO = "Link copiado";
export const COPY_PILL = "Convite aberto";
export const COPY_FICHA = "Ficha Técnica do Comboio";
export const COPY_BRIEFING = "Briefing obrigatório";

export const LABELS_RITMO_CAPA: Record<RitmoRole, string> = {
  tranquila: "Ritmo Tranquilo",
  moderada: "Ritmo Moderado",
  agressiva: "Ritmo Agressivo",
};

export const LABELS_RITMO_FICHA: Record<RitmoRole, string> = {
  tranquila: "Tranquila (abaixo de 90 km/h)",
  moderada: "Moderada (90-120 km/h)",
  agressiva: "Agressiva (track / ritmo forte)",
};

export const iniciaisDe = (nome: string, apelido: string): string => {
  const fonte = nome.trim() || apelido.trim() || "P";
  const tokens = fonte.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
  }
  const unico = tokens[0];
  if (unico.length >= 2) return unico.slice(0, 2).toUpperCase();
  return `${unico[0]}${unico[0]}`.toUpperCase();
};
