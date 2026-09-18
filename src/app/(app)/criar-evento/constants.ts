import type { AcessoEvento, AtracaoEvento, TipoEvento } from "@/types/evento";

export {
  ERRO_FOTO_GRANDE,
  MAX_FOTO_BYTES,
  TIPOS_FOTO_ACEITOS,
} from "@/lib/storage";

export const DEBOUNCE_BUSCA_MS = 300;
export const REDIRECT_SUCESSO_MS = 1600;

export const TITULO_MIN = 3;
export const TITULO_MAX = 80;
export const ENDERECO_MIN = 3;
export const INFORMACOES_MAX = 2000;

export const HORA_PADRAO = "19:30";
export const ACESSO_PADRAO: AcessoEvento = "gratis";

export const PLACEHOLDER_NOME = "Ex: Moto Rock Fest & Chopp Artesanal";
export const PLACEHOLDER_LOCAL = "Endereço, Galpão ou Ponto de Encontro";
export const PLACEHOLDER_INFORMACOES =
  "Ex: Chegue com o tanque cheio caso queira esticar para a serra. Proibido acelerar cortando giro no recinto residencial.";
export const PLACEHOLDER_LINK_INGRESSO = "https://www.sympla.com.br/...";
export const LINK_INGRESSO_MAX = 2000;

export const TITULO_PAGINA = "Criar Evento";
export const INTRO_TITULO = "Cadastrar Evento";
export const INTRO_SUBTITULO =
  "Cadastre encontros, moto points, confraternizações e track days. Não gera rota em estrada, os pilotos vão direto ao ponto.";
export const TOAST_TITULO = "Evento publicado com sucesso!";
export const TOAST_SUBTITULO = "Destino fixo no radar dos pilotos.";
export const CTA_PUBLICAR = "Publicar Evento";
export const CTA_PUBLICANDO = "Publicando...";
export const BANNER_RAIO =
  "Todos os pilotos em um raio de 40 km receberão notificação deste evento no feed comunitário.";
export const HINT_MAPA_VAZIO = "Busque o endereço ou use o GPS";
export const BADGE_PONTO = "Ponto verificado via Geocoding";
export const BADGE_PREVIA = "Prévia ativa";

export type OpcaoTipoEvento = {
  valor: TipoEvento;
  label: string;
  icone: string;
};

export const OPCOES_TIPO: OpcaoTipoEvento[] = [
  {
    valor: "moto_point_semanal",
    label: "Moto Point Semanal",
    icone: "sports_motorsports",
  },
  { valor: "track_day", label: "Track Day / Pista", icone: "flag" },
  { valor: "cafe_pilotos", label: "Café dos Pilotos", icone: "local_cafe" },
  {
    valor: "exposicao_custom",
    label: "Exposição & Custom",
    icone: "two_wheeler",
  },
];

export type OpcaoAcesso = {
  valor: AcessoEvento;
  label: string;
  subtitulo: string;
  icone: string;
};

export const OPCOES_ACESSO: OpcaoAcesso[] = [
  {
    valor: "gratis",
    label: "100% Grátis",
    subtitulo: "Livre Entrada",
    icone: "lock_open_right",
  },
  {
    valor: "ingresso",
    label: "Ingresso",
    subtitulo: "Portaria / Sympla",
    icone: "confirmation_number",
  },
];

export type OpcaoAtracao = {
  valor: AtracaoEvento;
  label: string;
  icone: string;
};

export const OPCOES_ATRACOES: OpcaoAtracao[] = [
  {
    valor: "estacionamento_monitorado",
    label: "Estacionamento Monitorado para Motos",
    icone: "local_parking",
  },
  {
    valor: "musica_ao_vivo",
    label: "Música ao Vivo / Rock",
    icone: "music_note",
  },
  {
    valor: "chopp_hamburguer",
    label: "Chopp & Hambúrguer Artesanal",
    icone: "lunch_dining",
  },
  {
    valor: "bancada_ferramentas",
    label: "Bancada de Ferramentas / Calibrador",
    icone: "home_repair_service",
  },
  {
    valor: "area_coberta",
    label: "Área 100% Coberta",
    icone: "roofing",
  },
];
