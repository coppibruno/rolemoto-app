import type { RitmoRole } from "@/types/role";
import type { Pilotagem } from "@/types/user";

export const TOAST_MS = 2500;
export const ANIMACAO_CARD_MS = 280;

export const HUD_TITULO = "Aprovações de Comboio";
export const HUD_BADGE = "Cockpit Líder";

export const LABELS_PILOTAGEM: Record<Pilotagem, string> = {
  tranquila: "Tranquila (até 90 km/h)",
  moderada: "Moderada (90-120 km/h)",
  agressiva: "Agressiva (track / ritmo forte)",
};

export const ICONES_PILOTAGEM: Record<Pilotagem, string> = {
  tranquila: "eco",
  moderada: "speed",
  agressiva: "bolt",
};

export const LABELS_RITMO: Record<RitmoRole, string> = {
  tranquila: "TRANQUILA",
  moderada: "MODERADA",
  agressiva: "AGRESSIVA",
};

export const rotuloPilotos = (n: number): string =>
  n === 1 ? "1 piloto" : `${n} pilotos`;

export const rotuloRoles = (n: number): string =>
  n === 1 ? "1 rolê" : `${n} rolês`;

export const textoRolesRodados = (n: number): string => {
  if (n <= 0) return "Ainda não rodou";
  if (n === 1) return "Já rodou 1 rolê";
  return `Já rodou ${n} rolês`;
};

export const toastAceite = (nome: string): string =>
  `${nome} foi aceito no comboio. O piloto será notificado.`;

export const toastRecusa = (nome: string): string =>
  `Solicitação de ${nome} recusada.`;

export const confirmRecusar = (nome: string, titulo: string): string =>
  `Deseja recusar a entrada de ${nome} em ${titulo}?`;

export const TEXTO_ALERTA_RITMO = (ritmo: RitmoRole): string =>
  `O ritmo planejado é ${LABELS_RITMO[ritmo]}. Certifique-se de que o piloto está ciente da velocidade dos trechos sinuosos antes de autorizar.`;

export const EMPTY_ORGANIZADO_TITULO = "Grid 100% Organizado!";
export const EMPTY_ORGANIZADO_TEXTO =
  "Todas as solicitações de pilotos foram avaliadas.";
export const EMPTY_SEM_HISTORICO =
  "Você ainda não recebeu pedidos. Publique um rolê para montar o comboio.";
export const EMPTY_CONFIRMADOS =
  "Nenhum piloto confirmado ainda. Os aceitos da fila aparecem aqui.";

export const ERRO_FILA = "Não foi possível carregar as aprovações";
export const ERRO_DECISAO = "Não foi possível concluir a decisão";
