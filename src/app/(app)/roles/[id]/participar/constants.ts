import type { RitmoRole } from "@/types/role";
import type { EstadoSheet } from "./types";

export const CHECKLIST_TITULO = "Checklist Pré-Pista";
export const CHECKLIST_TEXTO =
  "Enquanto isso: calibre os pneus a frio, abasteça e confira seu equipamento.";

export const LABELS_RITMO_BADGE: Record<RitmoRole, string> = {
  tranquila: "Tranquila (abaixo de 90 km/h)",
  moderada: "Moderada (90-120 km/h)",
  agressiva: "Agressiva (ritmo forte)",
};

export const LABELS_RITMO_FUNDO: Record<RitmoRole, string> = {
  tranquila: "Ritmo Tranquilo",
  moderada: "Ritmo Moderado",
  agressiva: "Ritmo Agressivo",
};

type CopySheet = {
  faixa: string;
  titulo: string;
  corpo: (apelido: string) => string;
};

export const COPY_SHEET: Record<Exclude<EstadoSheet, "organizador">, CopySheet> =
  {
    aguardando: {
      faixa: "Aguardando Piloto Líder",
      titulo: "Solicitação enviada com sucesso!",
      corpo: (apelido) =>
        `Você pediu para entrar no comboio. @${apelido} vai ver seu perfil e você recebe um aviso quando a vaga for confirmada.`,
    },
    confirmado: {
      faixa: "Vaga confirmada",
      titulo: "Você está no comboio!",
      corpo: (apelido) =>
        `O organizador @${apelido} confirmou sua vaga.`,
    },
    recusado: {
      faixa: "Pedido recusado",
      titulo: "Sem vaga desta vez",
      corpo: (apelido) =>
        `O organizador @${apelido} não confirmou sua entrada neste rolê.`,
    },
  };

export const ERRO_ROLE_NAO_ENCONTRADO = "Rolê não encontrado";
export const ERRO_NOTIFICAR = "Não foi possível atualizar as notificações.";
export const ERRO_CANCELAR = "Não foi possível cancelar o pedido.";
export const ERRO_GENERICO = "Não foi possível carregar este rolê.";
