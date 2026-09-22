import type { RitmoRole } from "@/types/role";

export const TITULO_TELA = "Gerenciar rolê";
export const BADGE_LIDER = "Cockpit líder";

export const ERRO_CARREGAR = "Não foi possível carregar o rolê";
export const ERRO_ROLE_NAO_ENCONTRADO = "Rolê não encontrado";
export const ERRO_SEM_ACESSO = "Só o líder pode gerenciar este rolê";
export const ERRO_CANCELAR_ROLE = "Não foi possível cancelar o rolê.";

export const SECAO_AGUARDANDO = "Aguardando aprovação";
export const SECAO_CONFIRMADOS = "Confirmados";

export const VAZIO_PENDENTES =
  "Nenhum pedido aguardando. Compartilhe o convite para montar o comboio.";
export const VAZIO_CONFIRMADOS = "Nenhum piloto confirmado ainda.";

export const LABELS_RITMO: Record<RitmoRole, string> = {
  tranquila: "Tranquila",
  moderada: "Moderada",
  agressiva: "Agressiva",
};

export const LABEL_CONTAGEM_PENDENTES = "Pendentes";
export const LABEL_CONTAGEM_CONFIRMADOS = "Confirmados";

export const hrefEditarRole = (roleId: string): string =>
  `/criar-role?editar=${encodeURIComponent(roleId)}`;

export const saidaFutura = (iso: string): boolean => Date.parse(iso) > Date.now();
