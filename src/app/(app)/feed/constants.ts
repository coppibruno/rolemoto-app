import type { AbaFeed, FiltroQuando, FiltroRitmo, RaioKm } from "./types";

export const RAIO_PADRAO: RaioKm | null = null;
export const QUANDO_PADRAO: FiltroQuando = "proximos_roles";
export const RITMO_PADRAO: FiltroRitmo = "todas";
export const ABA_PADRAO: AbaFeed = "roles";

export const OPCOES_RAIO: { valor: RaioKm; label: string; pill: string }[] = [
  { valor: 25, label: "Até 25 km", pill: "25 KM" },
  { valor: 50, label: "Até 50 km", pill: "50 KM" },
  { valor: 100, label: "Até 100 km", pill: "100 KM" },
  { valor: null, label: "Sem limite", pill: "TODOS" },
];

export const CICLO_RAIO: RaioKm[] = [25, 50, 100, null];

export const OPCOES_QUANDO: {
  valor: Exclude<FiltroQuando, { tipo: "data" }>;
  label: string;
}[] = [
  { valor: "proximos_roles", label: "Próximos Rolês" },
  { valor: "hoje", label: "Hoje" },
  { valor: "amanha", label: "Amanhã" },
  { valor: "fim_de_semana", label: "Neste Fim de Semana" },
];

export const OPCOES_RITMO: { valor: FiltroRitmo; label: string }[] = [
  { valor: "todas", label: "Todas" },
  { valor: "tranquila", label: "Tranquila" },
  { valor: "moderada", label: "Moderada" },
  { valor: "agressiva", label: "Agressiva" },
];

export const ABAS_FEED: {
  id: AbaFeed;
  label: string;
  icone: string;
  painelId: string;
}[] = [
  {
    id: "roles",
    label: "Rolês",
    icone: "two_wheeler",
    painelId: "painel-roles",
  },
  {
    id: "eventos",
    label: "Eventos",
    icone: "local_activity",
    painelId: "painel-eventos",
  },
  {
    id: "locais",
    label: "Locais",
    icone: "near_me",
    painelId: "painel-locais",
  },
];

export const PLACEHOLDER_BUSCA = "Buscar rolês, eventos ou pontos…";

export const ESTADOS_VAZIOS: Record<
  AbaFeed,
  { titulo: string; texto: string }
> = {
  roles: {
    titulo: "Nenhum rolê por aqui",
    texto:
      "Não encontramos rolês com esses filtros. Aumente o raio, mude a data ou o ritmo.",
  },
  eventos: {
    titulo: "Nenhum evento por aqui",
    texto:
      "Não encontramos eventos com esses filtros. Aumente o raio ou mude a data.",
  },
  locais: {
    titulo: "Nenhum local por aqui",
    texto:
      "Não encontramos pontos oficiais nesse raio. Aumente o raio ou limpe a busca.",
  },
};

export const DEBOUNCE_BUSCA_MS = 300;
export const STORAGE_PONTO = "rolemoto.feed.ponto";
export const STORAGE_ABA = "rolemoto.feed.aba";

export const LABELS_ACESSO_EVENTO = {
  gratis: "Entrada Franca",
  ingresso: "Ingresso",
} as const;

export const TOAST_INSCRICAO_OK = "Inscrição confirmada!";
export const TOAST_INSCRICAO_MS = 2800;
export const CONFIRMA_CANCELAR_INSCRICAO =
  "Cancelar sua inscrição neste evento?";

export const MODAL_INGRESSO = {
  titulo: "Ingresso necessário",
  corpo:
    "Sua inscrição no evento foi confirmada. Para garantir a entrada, compre o ingresso no link do organizador.",
  comprar: "Ir para a compra",
  agoraNao: "Agora não",
} as const;

export const ERRO_LINK_INGRESSO = "Link de ingresso indisponível";
export const ERRO_INSCRICAO_GENERICO = "Não foi possível concluir a inscrição";
export const ERRO_CANCELAR_INSCRICAO = "Não foi possível cancelar a inscrição";
export const ERRO_FAVORITO = "Não foi possível atualizar o favorito.";

export const LABELS_CATEGORIA_LOCAL = {
  posto: "Pit Stop Oficial",
  bar_moto_point: "Bar & Moto Point",
  restaurante_estrada: "Restaurante Estrada",
  oficina: "Oficina",
  mirante: "Mirante",
} as const;

export const ICONES_CATEGORIA_LOCAL = {
  posto: "local_gas_station",
  bar_moto_point: "sports_bar",
  restaurante_estrada: "restaurant",
  oficina: "build",
  mirante: "landscape",
} as const;

export const FACILIDADES_FEED: {
  valor: string;
  label: string;
  icone: string;
}[] = [
  {
    valor: "patio_amplo_50",
    label: "Pátio Amplo",
    icone: "two_wheeler",
  },
  {
    valor: "calibrador_alta_pressao",
    label: "Calibrador",
    icone: "tire_repair",
  },
  { valor: "banheiros_limpos", label: "Banheiros", icone: "shower" },
  {
    valor: "conveniencia_cafe",
    label: "Café Expresso",
    icone: "local_cafe",
  },
  { valor: "wifi_aberto", label: "Wi-Fi", icone: "wifi" },
  {
    valor: "cameras_24h",
    label: "Câmeras",
    icone: "videocam",
  },
];
