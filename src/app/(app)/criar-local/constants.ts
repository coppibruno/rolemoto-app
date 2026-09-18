export {
  ERRO_FOTO_GRANDE,
  MAX_FOTO_BYTES,
  TIPOS_FOTO_ACEITOS,
} from "@/lib/storage";

export const DEBOUNCE_BUSCA_MS = 300;
export const REDIRECT_SUCESSO_MS = 1600;
export const NOME_MIN = 3;
export const NOME_MAX = 80;
export const ENDERECO_MIN = 3;
export const LINK_MAPS_MAX = 500;
export const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
export const HORA_ABERTURA_PADRAO = "08:00";
export const HORA_FECHAMENTO_PADRAO = "18:00";

export const PLACEHOLDER_NOME = "Ex: Posto Shell Rodoanel Sul - Km 42";
export const PLACEHOLDER_ENDERECO = "Ex: Rod. Mário Covas, Km 42 - Pista Externa";
export const PLACEHOLDER_LINK_MAPS = "https://maps.app.goo.gl/...";

export const TITULO_PAGINA = "Criar Local";
export const INTRO_TITULO = "Cadastrar Ponto / Local";
export const INTRO_SUBTITULO =
  "Pontos oficiais de encontro, postos parceiros, bases de apoio e mirantes estratégicos.";
export const TOAST_TITULO = "Ponto Homologado com Sucesso!";
export const TOAST_SUBTITULO =
  "Disponível imediatamente para todos os comboios no mapa.";
export const CTA_SALVAR = "Salvar Local";
export const CTA_SALVANDO = "Salvando...";

export {
  OPCOES_CATEGORIA,
  OPCOES_FACILIDADES,
  type OpcaoCategoria,
  type OpcaoFacilidade,
} from "../locais/constants";
