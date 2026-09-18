import { api } from "@/lib/api";
import type {
  ParticipantesLista,
  TipoAlvoParticipantes,
} from "@/types/participante";

const caminho = (tipo: TipoAlvoParticipantes, id: string) =>
  tipo === "role" ? `/roles/${id}/participantes` : `/eventos/${id}/participantes`;

export const participantesService = {
  listar: (tipo: TipoAlvoParticipantes, id: string) =>
    api<ParticipantesLista>(caminho(tipo, id)),
};
