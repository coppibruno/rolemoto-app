import type { TipoAlvoParticipantes } from "@/types/participante";

export const TITULOS_PARTICIPANTES: Record<TipoAlvoParticipantes, string> = {
  role: "Pilotos confirmados",
  evento: "Inscritos no evento",
};

export const COPY_VAZIO_PARTICIPANTES: Record<TipoAlvoParticipantes, string> = {
  role: "Nenhum piloto confirmado ainda.",
  evento: "Ninguém se inscreveu ainda.",
};

export const rotuloTotal = (tipo: TipoAlvoParticipantes, total: number) => {
  if (tipo === "evento") {
    return total === 1 ? "1 inscrito" : `${total} inscritos`;
  }
  return total === 1 ? "1 confirmado" : `${total} confirmados`;
};
