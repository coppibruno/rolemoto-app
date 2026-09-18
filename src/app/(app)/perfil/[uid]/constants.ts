import type { ItemHistoricoPista, StatusItemHistorico } from "@/types/historico-pistas";
import type { AbaHistoricoPublico } from "@/types/perfil-publico";

export const TOAST_LINK_MS = 2800;

export type DefAbaHistoricoPublico = {
  id: AbaHistoricoPublico;
  label: string;
  listaAria: string;
};

export const ABAS_HISTORICO_PUBLICO: DefAbaHistoricoPublico[] = [
  {
    id: "concluidos",
    label: "Concluídos",
    listaAria: "Rolês concluídos ou confirmados",
  },
  {
    id: "comoLider",
    label: "Como Líder",
    listaAria: "Rolês publicados como líder",
  },
];

export const VAZIOS_HISTORICO_PUBLICO: Record<
  AbaHistoricoPublico,
  { titulo: string; corpo: string; icone: string }
> = {
  concluidos: {
    titulo: "Nenhum comboio ainda",
    corpo: "Quando este piloto participar de rolês, eles aparecem aqui.",
    icone: "explore_off",
  },
  comoLider: {
    titulo: "Ainda não liderou",
    corpo: "Rolês criados por este piloto vão aparecer nesta aba.",
    icone: "add_road",
  },
};

export const PAPEL_CARD: Record<"participante" | "lider", string> = {
  participante: "Participante",
  lider: "Líder Oficial",
};

export const STATUS_CARD_PUBLICO: Partial<Record<StatusItemHistorico, string>> = {
  confirmado: "Confirmado",
  concluido: "Concluído",
  lider: "Líder Oficial",
};

export const ERRO_PERFIL_PUBLICO = "Não foi possível carregar o perfil";
export const ERRO_HISTORICO_PUBLICO = "Não foi possível carregar o histórico";
export const PILOTO_NAO_ENCONTRADO = "Piloto não encontrado";

export const ariaBadgeAba = (label: string, n: number): string =>
  `${label}, ${n} rolês`;

export const totalRolesHistorico = (concluidos: number, comoLider: number): number =>
  concluidos + comoLider;

export const textoTotalRoles = (n: number): string =>
  n === 1 ? "1 Rolê" : `${n} Rolês`;

export const hrefCardHistoricoPublico = (item: ItemHistoricoPista): string => {
  if (item.status === "lider") return `/roles/${item.roleId}/participar`;
  if (item.status === "concluido") return `/roles/${item.roleId}/feedback`;
  return `/roles/${item.roleId}/participar`;
};
