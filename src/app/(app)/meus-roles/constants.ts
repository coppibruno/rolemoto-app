import type { AbaMeusRoles, MeuRoleItem, PapelMeuRole } from "@/types/meus-roles";
import type { RitmoRole } from "@/types/role";

export const SUBTITULO_GARAGEM =
  "Gerencie seus comboios ativos, solicitações em análise e a sua quilometragem percorrida.";

export const ERRO_MEUS_ROLES = "Não foi possível carregar seus rolês";
export const ERRO_ACAO = "Não foi possível atualizar a participação.";

export const LABELS_RITMO: Record<RitmoRole, string> = {
  tranquila: "Tranquila (abaixo de 90 km/h)",
  moderada: "Moderada (90-120 km/h)",
  agressiva: "Agressiva (track / ritmo forte)",
};

export const ABAS_MEUS_ROLES: { id: Exclude<AbaMeusRoles, "proximos">; label: string }[] =
  [
    { id: "confirmados", label: "Confirmados" },
    { id: "aguardando", label: "Aguardando" },
    { id: "concluidos", label: "Concluídos" },
    { id: "recusados", label: "Recusados" },
  ];

export const VAZIOS: Record<AbaMeusRoles | "tune", { titulo: string; corpo: string }> = {
  proximos: {
    titulo: "Nenhum comboio na garagem",
    corpo: "Peça vaga num rolê do feed ou toque no + para organizar o seu.",
  },
  confirmados: {
    titulo: "Nenhuma vaga assegurada",
    corpo: "Quando o líder aceitar (ou você publicar um rolê), o comboio aparece aqui.",
  },
  aguardando: {
    titulo: "Nada em análise",
    corpo: "Você não tem pedido aguardando o piloto líder.",
  },
  concluidos: {
    titulo: "Asfalto zerado",
    corpo: "Os rolês que você concluiu entram aqui com a quilometragem da rota.",
  },
  recusados: {
    titulo: "Nenhuma recusa",
    corpo: "Você não teve nenhum pedido recusado.",
  },
  tune: {
    titulo: "Nenhum rolê com esses filtros",
    corpo: "Limpe o ritmo ou o papel no tune.",
  },
};

export const OPCOES_RITMO: { id: RitmoRole | "todas"; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "tranquila", label: "Tranquila" },
  { id: "moderada", label: "Moderada" },
  { id: "agressiva", label: "Agressiva" },
];

export const OPCOES_PAPEL: { id: PapelMeuRole | "todos"; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "participante", label: "Participante" },
  { id: "organizador", label: "Organizador" },
];

export const hrefMeuRole = (item: MeuRoleItem): string => {
  if (item.status === "pendente" || item.status === "confirmado") {
    return `/roles/${item.roleId}/participar`;
  }
  if (item.status === "lider") return `/aprovacoes?role=${item.roleId}`;
  if (item.papel === "organizador") return `/aprovacoes?role=${item.roleId}`;
  return `/roles/${item.roleId}/feedback`;
};

export const hrefClonarRole = (roleId: string): string =>
  `/criar-role?origem=${encodeURIComponent(roleId)}`;

export const confirmDesistir = (titulo: string): string =>
  `Deseja desistir da vaga em ${titulo}?`;

export const confirmCancelar = (titulo: string): string =>
  `Deseja cancelar a solicitação para o rolê ${titulo}?`;
