import type { AbaHistorico, ItemHistoricoPista, StatusItemHistorico } from "@/types/historico-pistas";
import type { Pilotagem } from "@/types/user";

export const MAX_FOTO_BYTES = 2 * 1024 * 1024;
export const TIPOS_FOTO_ACEITOS = ["image/jpeg", "image/png"];
export const TOAST_MS = 3500;

export type OpcaoPilotagem = {
  valor: Pilotagem;
  icone: string;
  label: string;
  subtitulo: string;
};

export const OPCOES_PILOTAGEM: OpcaoPilotagem[] = [
  {
    valor: "tranquila",
    icone: "spa",
    label: "Tranquila",
    subtitulo: "Abaixo de 90 km/h",
  },
  {
    valor: "moderada",
    icone: "two_wheeler",
    label: "Moderada",
    subtitulo: "Fluida & Constante",
  },
  {
    valor: "agressiva",
    icone: "sports_score",
    label: "Agressiva",
    subtitulo: "Esportivo / Pista",
  },
];

export type DefAbaHistorico = {
  id: AbaHistorico;
  label: string;
  listaAria: string;
};

export const ABAS_HISTORICO: DefAbaHistorico[] = [
  {
    id: "aguardando",
    label: "Aguardando",
    listaAria: "Rolês aguardando aprovação",
  },
  {
    id: "participei",
    label: "Participei",
    listaAria: "Rolês em que você participou",
  },
  {
    id: "criados",
    label: "Criados",
    listaAria: "Rolês que você publicou",
  },
];

export const VAZIOS_HISTORICO: Record<
  AbaHistorico,
  { titulo: string; corpo: string; icone: string }
> = {
  aguardando: {
    titulo: "Nada na fila",
    corpo: "Você não tem pedido aguardando o piloto líder.",
    icone: "explore_off",
  },
  participei: {
    titulo: "Nenhum comboio ainda",
    corpo:
      "Quando o líder confirmar e o rolê entrar no histórico, ele aparece aqui.",
    icone: "explore_off",
  },
  criados: {
    titulo: "Você ainda não publicou",
    corpo: "Toque no + do dock para organizar um rolê.",
    icone: "add_road",
  },
};

export const STATUS_DIREITA: Record<StatusItemHistorico, string> = {
  pendente: "Em análise",
  confirmado: "Confirmado",
  concluido: "Concluído",
  lider: "Líder",
};

export const LINHA1_LIDER = "Criado por você";

export const ERRO_HISTORICO = "Não foi possível carregar o histórico";

export const ariaBadgeAba = (label: string, n: number): string =>
  `${label}, ${n} rolês`;

export const hrefCardHistorico = (item: ItemHistoricoPista): string => {
  if (item.status === "lider") return `/aprovacoes?role=${item.roleId}`;
  if (item.status === "concluido") return `/roles/${item.roleId}/feedback`;
  return `/roles/${item.roleId}/participar`;
};

export const hrefClonarRole = (roleId: string): string =>
  `/criar-role?origem=${encodeURIComponent(roleId)}`;

export const ariaCardHistorico = (item: ItemHistoricoPista): string => {
  if (item.status === "pendente") {
    return `Abrir ${item.titulo}, em análise`;
  }
  if (item.status === "concluido") {
    return `Avaliar ou ver relatos de ${item.titulo}`;
  }
  return `Abrir ${item.titulo}`;
};
