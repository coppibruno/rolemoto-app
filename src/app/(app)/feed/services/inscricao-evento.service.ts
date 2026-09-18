import { api } from "@/lib/api";
import type { UsuarioEvento } from "@/types/usuario-evento";

export const inscricaoEventoService = {
  inscrever: (eventoId: string) =>
    api<UsuarioEvento>(`/eventos/${eventoId}/inscricao`, { method: "POST" }),

  buscar: (eventoId: string) =>
    api<UsuarioEvento>(`/eventos/${eventoId}/inscricao`),

  cancelar: (eventoId: string) =>
    api<void>(`/eventos/${eventoId}/inscricao`, { method: "DELETE" }),
};
