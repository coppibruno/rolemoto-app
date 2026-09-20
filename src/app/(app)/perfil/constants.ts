import type {
  AbaHistorico,
  ItemHistoricoEvento,
  ItemHistoricoPista,
  ItemHistoricoRole,
  StatusItemHistorico,
} from "@/types/historico-pistas";
import type { Pilotagem } from "@/types/user";

export {
  ERRO_FOTO_GRANDE,
  MAX_FOTO_BYTES,
  TIPOS_FOTO_ACEITOS,
} from "@/lib/storage";
export const TOAST_MS = 3500;
export const CIDADE_MIN = 2;
export const CIDADE_MAX = 80;
export const HINT_CIDADE = "opcional · aparece na fila de aprovação";

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
    listaAria: "Rolês e eventos em que você participou",
  },
  {
    id: "criados",
    label: "Criados",
    listaAria: "Rolês que você publicou",
  },
];

export const FILTROS_TIPO_HISTORICO = [
  { id: "todos" as const, label: "Todos" },
  { id: "roles" as const, label: "Rolês" },
  { id: "eventos" as const, label: "Eventos" },
  { id: "telemetria" as const, label: "Telemetria" },
];

export const VAZIO_TELEMETRIA = {
  titulo: "Nenhum passeio gravado",
  corpo: "Toque no + e escolha Gravar meu rolê.",
  icone: "speed",
};

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
      "Quando o líder confirmar o rolê ou você se inscrever em um evento, eles aparecem aqui.",
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
  `${label}, ${n} itens`;

export const hrefCardHistoricoRole = (item: ItemHistoricoRole): string => {
  if (item.status === "lider") return `/aprovacoes?role=${item.roleId}`;
  if (item.status === "concluido") return `/roles/${item.roleId}/feedback`;
  return `/roles/${item.roleId}/participar`;
};

export const hrefCardHistoricoEvento = (item: ItemHistoricoEvento): string => {
  if (item.status === "concluido") return `/eventos/${item.eventoId}/avaliar`;
  return `/eventos/${item.eventoId}`;
};

export const hrefCardHistorico = (item: ItemHistoricoPista): string => {
  if (item.tipo === "evento") return hrefCardHistoricoEvento(item);
  return hrefCardHistoricoRole(item);
};

export const hrefClonarRole = (roleId: string): string =>
  `/criar-role?origem=${encodeURIComponent(roleId)}`;

export const ariaCardHistorico = (item: ItemHistoricoPista): string => {
  if (item.tipo === "evento") {
    if (item.status === "concluido") {
      return `Avaliar ou ver avaliações de ${item.titulo}`;
    }
    return `Abrir evento ${item.titulo}, ${STATUS_DIREITA[item.status]}`;
  }
  if (item.status === "pendente") {
    return `Abrir ${item.titulo}, em análise`;
  }
  if (item.status === "concluido") {
    return `Avaliar ou ver relatos de ${item.titulo}`;
  }
  return `Abrir ${item.titulo}`;
};
