import type { RitmoRole } from "@/types/role";

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
export const DESCRICAO_MAX = 2000;

export const RITMO_PADRAO: RitmoRole = "moderada";
export const HORA_PADRAO = "07:30";

export const PLACEHOLDER_TITULO = "Ex: Café com Curvas na Serra Negra";
export const PLACEHOLDER_PARTIDA = "Posto Shell Rodovia km 22";
export const PLACEHOLDER_DESTINO = "Ex: Mirante Alto da Serra";
export const PLACEHOLDER_NOME_PARTIDA = "Ex.: Posto Shell km 24";
export const PLACEHOLDER_NOME_DESTINO = "Ex.: Mirante da Serra";
export const PLACEHOLDER_DESCRICAO =
  "Dicas de pedágio, abastecimento, canal do rádio comunicador e regras de ultrapassagem...";

export const TITULO_PAGINA = "Criar Rolê";
export const TITULO_PAGINA_CLONE = "Clonar Rolê";
export const INTRO_TITULO = "Organizar Novo Rolê";
export const INTRO_TITULO_CLONE = "Mesma pista, nova data";
export const INTRO_SUBTITULO =
  "Defina a rota, o ritmo e convoque os pilotos pro asfalto.";
export const INTRO_SUBTITULO_CLONE =
  "Rota, ritmo e capa vêm do rolê original. Escolha o dia da próxima saída.";
export const FAIXA_CLONANDO = "Clonando rota";
export const TOAST_TITULO = "Rolê Criado com Sucesso!";
export const TOAST_TITULO_CLONE = "Rolê clonado com sucesso!";
export const TOAST_SUBTITULO =
  "Comboio aberto para os pilotos confirmarem presença.";
export const BADGE_CAPA = "Capa Atualizada";
export const BADGE_CAPA_ORIGINAL = "Capa do original";
export const ERRO_MODELO_403 = "Só o piloto líder pode clonar este rolê.";
export const ERRO_MODELO_404 = "Não encontramos este rolê.";
export const ERRO_MODELO_REDE = "Não foi possível carregar a rota original.";

export type OpcaoRitmo = {
  valor: RitmoRole;
  label: string;
  subtitulo: string;
  hint: string;
};

export const OPCOES_RITMO: OpcaoRitmo[] = [
  {
    valor: "tranquila",
    label: "Tranquila",
    subtitulo: "Abaixo de 90 km/h",
    hint: "Passeio turístico, fotos e curvas suaves",
  },
  {
    valor: "moderada",
    label: "Moderada",
    subtitulo: "90 - 120 km/h",
    hint: "Equilíbrio e curvas com velocidade cruzeiro",
  },
  {
    valor: "agressiva",
    label: "Agressiva",
    subtitulo: "Track / Ritmo Forte",
    hint: "Curvas técnicas, ritmo acelerado e poucas paradas",
  },
];
