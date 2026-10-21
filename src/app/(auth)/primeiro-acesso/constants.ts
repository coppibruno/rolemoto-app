import type { Pilotagem } from "@/types/user";

export {
  ERRO_FOTO_GRANDE,
  MAX_FOTO_BYTES,
  TIPOS_FOTO_ACEITOS,
} from "@/lib/storage";

export const COPY = {
  titulo: "Bem-vindo ao Rolê Moto",
  subtitulo: "Só o básico para você entrar nos rolês.",
  fotoAdicionar: "Adicionar foto",
  fotoTrocar: "Trocar foto",
  fotoOpcional: "opcional",
  nomeLabel: "Seu nome",
  nomePlaceholder: "Ex: Rodrigo Silveira",
  motoLabel: "Sua moto",
  motoPlaceholder: "Ex: Honda CB 650R",
  ritmoTitulo: "Seu ritmo",
  ritmoSubtitulo: "Os líderes dos rolês usam isso para aprovar sua vaga.",
  ctaIdle: "Entrar nos rolês",
  ctaEnviando: "Salvando…",
  rodape: "Apelido, tipo da moto, garupa e cidade você completa depois no perfil.",
  erroGenerico: "Erro ao salvar o perfil. Tente novamente.",
} as const;

export type OpcaoRitmoHabitual = {
  valor: Pilotagem;
  label: string;
  descricao: string;
};

export const OPCOES_RITMO_HABITUAL: OpcaoRitmoHabitual[] = [
  {
    valor: "tranquila",
    label: "Tranquila",
    descricao: "Sem pressa, com paradas e paisagem.",
  },
  {
    valor: "moderada",
    label: "Moderada",
    descricao: "Ritmo constante e seguro na estrada.",
  },
  {
    valor: "agressiva",
    label: "Agressiva",
    descricao: "Curvas e acelerações, para quem tem experiência.",
  },
];
