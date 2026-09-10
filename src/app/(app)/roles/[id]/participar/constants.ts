import type { RitmoRole } from "@/types/role";
import type { EstadoSheet } from "./types";

export const CHECKLIST_TITULO = "Checklist Pré-Pista";
export const CHECKLIST_TEXTO =
  "Enquanto isso: certifique-se de calibrar os pneus a frio, abastecer o tanque e revisar o canal 4 do seu comunicador.";

export const LABELS_RITMO_BADGE: Record<RitmoRole, string> = {
  tranquila: "Tranquila (abaixo de 90 km/h)",
  moderada: "Moderada (90-120 km/h)",
  agressiva: "Agressiva (track / ritmo forte)",
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
        `Você pediu entrada no comboio. O organizador @${apelido} irá revisar seu perfil e você receberá um aviso assim que sua vaga for confirmada na grade.`,
    },
    confirmado: {
      faixa: "Vaga confirmada na grade",
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
