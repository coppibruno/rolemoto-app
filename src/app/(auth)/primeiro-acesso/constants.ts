import type { Pilotagem } from "@/types/user";

export {
  ERRO_FOTO_GRANDE,
  MAX_FOTO_BYTES,
  TIPOS_FOTO_ACEITOS,
} from "@/lib/storage";
export const DELAY_MOTOR_MS = 800;
export const DELAY_SUCESSO_MS = 1100;

export const normalizarApelido = (valor: string) =>
  valor.trim().replace(/^@+/, "");

export const COPY = {
  kicker: "Passo 1 de 1 • Onboarding",
  titulo: "Monte Seu Perfil de Piloto",
  subtitulo:
    "Configure sua identidade para que os líderes e comboios conheçam seu estilo antes de acelerar juntos.",
  fotoTitulo: "Mostre sua cara no comboio",
  fotoSubtitulo:
    "Fotos com ou sem capacete ajudam no reconhecimento nos pontos de encontro.",
  fotoAdicionar: "Adicionar Foto de Perfil",
  fotoTrocar: "Trocar foto de perfil",
  dadosTitulo: "Dados do Piloto",
  nomeLabel: "Nome Completo",
  nomePlaceholder: "Ex: Rodrigo Silveira",
  apelidoLabel: "Apelido nas Pistas",
  apelidoHint: "Identificador Único",
  apelidoPlaceholder: "apelido_estrada",
  apelidoHintAbaixo:
    "Como a turma e os batedores vão te chamar no rádio e no feed.",
  garagemTitulo: "Garagem Principal",
  badgeMoto: "Moto Titular",
  motoLabel: "Modelo • Cilindrada • Ano",
  motoPlaceholder: "Ex: Honda CB 650R 2022",
  garupaLabel: "Possui Garupa Frequente?",
  garupaHint: "Os líderes consideram isso na logística do comboio.",
  ritmoTitulo: "Ritmo de Pilotagem Habitual",
  ritmoSelecione: "Selecione um",
  ritmoSubtitulo:
    "Isso ajuda líderes e comboios a conhecerem seu estilo antes de acelerar juntos.",
  ctaIdle: "Concluir e Acessar os Rolês",
  ctaEnviando: "Ligando o Motor…",
  ctaSucesso: "BEM-VINDO AO ASFALTO!",
  rodape:
    "Você poderá editar nome, apelido, foto, moto, garupa e ritmo a qualquer momento no seu perfil.",
  erroGenerico: "Erro ao salvar o perfil. Tente novamente.",
} as const;

export type OpcaoRitmoHabitual = {
  valor: Pilotagem;
  icone: string;
  label: string;
  telemetria: string;
  descricao: string;
  recomendado: boolean;
};

export const OPCOES_RITMO_HABITUAL: OpcaoRitmoHabitual[] = [
  {
    valor: "tranquila",
    icone: "photo_camera_front",
    label: "Tranquila",
    telemetria: "Até 90 km/h",
    descricao:
      "Passeio contemplativo, foco total em segurança, fotos, apreciação de paisagem e paradas para café.",
    recomendado: false,
  },
  {
    valor: "moderada",
    icone: "alt_route",
    label: "Moderada",
    telemetria: "120 a 160 km/h",
    descricao:
      "Ritmo constante, fluidez técnica em curvas, ultrapassagens seguras e conscientes em rodovias.",
    recomendado: true,
  },
  {
    valor: "agressiva",
    icone: "sports_score",
    label: "Agressiva / Esportiva",
    telemetria: "Ritmo de Pista • Serra",
    descricao:
      "Acelerações fortes, inclinação rápida em curvas e pilotagem técnica dinâmica para condutores experientes.",
    recomendado: false,
  },
];
