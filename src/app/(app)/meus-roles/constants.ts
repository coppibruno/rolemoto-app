import type {
  AbaMeusRoles,
  AbaTipoGaragem,
  MeuRoleItem,
  PapelMeuRole,
  PillAvaliacaoGaragem,
} from "@/types/meus-roles";
import type { RitmoRole } from "@/types/role";

export const SUBTITULO_GARAGEM =
  "Seus comboios, eventos inscritos e pontos favoritos — tudo na garagem.";

export const ERRO_MEUS_ROLES = "Não foi possível carregar seus rolês";
export const ERRO_MEUS_EVENTOS = "Não foi possível carregar seus eventos";
export const ERRO_MEUS_LOCAIS = "Não foi possível carregar seus locais";
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

export const ABAS_TIPO_GARAGEM: {
  id: AbaTipoGaragem;
  label: string;
  icone: string;
}[] = [
  { id: "roles", label: "Rolês", icone: "two_wheeler" },
  { id: "eventos", label: "Eventos", icone: "local_activity" },
  { id: "locais", label: "Locais", icone: "local_gas_station" },
];

export const PILLS_AVALIACAO: {
  id: PillAvaliacaoGaragem;
  label: string;
  icone: string;
}[] = [
  { id: "todos", label: "Todos recentes", icone: "schedule" },
  { id: "aguardando_avaliacao", label: "Aguardando avaliação", icone: "rate_review" },
  { id: "avaliados", label: "Avaliados", icone: "check_circle" },
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

export const VAZIOS_EVENTOS: Record<
  PillAvaliacaoGaragem,
  { titulo: string; corpo: string }
> = {
  todos: {
    titulo: "Nenhum evento inscrito",
    corpo: "Você ainda não se inscreveu em eventos. Explore a aba Eventos no feed.",
  },
  aguardando_avaliacao: {
    titulo: "Nada pendente",
    corpo: "Nenhum evento esperando sua avaliação.",
  },
  avaliados: {
    titulo: "Sem relatos ainda",
    corpo: "Você ainda não publicou relatos de eventos.",
  },
};

export const VAZIOS_LOCAIS: Record<
  PillAvaliacaoGaragem,
  { titulo: string; corpo: string }
> = {
  todos: {
    titulo: "Nenhum favorito",
    corpo: "Favorite um ponto no feed (aba Locais) para vê-lo aqui.",
  },
  aguardando_avaliacao: {
    titulo: "Nada pendente",
    corpo: "Seus favoritos já estão em dia — ou ainda sem avaliação.",
  },
  avaliados: {
    titulo: "Sem relatos ainda",
    corpo: "Nenhum favorito avaliado ainda.",
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

export const LABELS_TELEMETRIA = {
  rolesFeitos: "Rolês feitos",
  eventosParticipados: "Eventos part.",
  locaisFavoritos: "Locais favoritos",
} as const;

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

export const hrefEditarRole = (roleId: string): string =>
  `/criar-role?editar=${encodeURIComponent(roleId)}`;

export const hrefAvaliarEvento = (eventoId: string): string =>
  `/eventos/${eventoId}/avaliar`;

export const hrefDetalheEvento = (eventoId: string): string =>
  `/eventos/${eventoId}`;

export const hrefAvaliarLocal = (localId: string): string =>
  `/locais/${localId}/avaliar`;

export const saidaFutura = (iso: string): boolean => Date.parse(iso) > Date.now();

export const confirmDesistir = (titulo: string): string =>
  `Deseja desistir da vaga em ${titulo}?`;

export const confirmCancelar = (titulo: string): string =>
  `Deseja cancelar a solicitação para o rolê ${titulo}?`;

export const confirmCancelarRole = (titulo: string): string =>
  `Cancelar “${titulo}”? Os pilotos aceitos serão notificados e o rolê some do feed.`;

export const ERRO_CANCELAR_ROLE = "Não foi possível cancelar o rolê.";
export const TOAST_ROLE_CANCELADO = "Rolê cancelado.";
export const TOAST_MEUS_ROLES_MS = 3500;
