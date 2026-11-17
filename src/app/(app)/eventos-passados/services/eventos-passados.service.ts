import { api } from "@/lib/api";
import type { EventoPassadoAdmin } from "@/types/evento-passado-admin";

export const eventosPassadosService = {
  listar: () => api<EventoPassadoAdmin[]>("/eventos/admin/passados"),
};
