import { api } from "@/lib/api";
import type {
  ParticipantesLista,
  TipoAlvoParticipantes,
} from "@/types/participante";

const caminho = (tipo: TipoAlvoParticipantes, id: string) => {
  const seguro = encodeURIComponent(id);
  return tipo === "role"
    ? `/roles/${seguro}/participantes`
    : `/eventos/${seguro}/participantes`;
};

export const participantesService = {
  listar: (tipo: TipoAlvoParticipantes, id: string) =>
    api<ParticipantesLista>(caminho(tipo, id)),
};
