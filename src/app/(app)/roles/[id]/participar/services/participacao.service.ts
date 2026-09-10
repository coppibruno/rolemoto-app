import { api } from "@/lib/api";
import type { RoleDetalhe, UsuarioRole } from "@/types/role";

export const participacaoService = {
  buscarDetalhe: (roleId: string) => api<RoleDetalhe>(`/roles/${roleId}`),

  solicitar: (roleId: string) =>
    api<UsuarioRole>(`/roles/${roleId}/participacao`, { method: "POST" }),

  atualizarNotificar: (roleId: string, notificar: boolean) =>
    api<UsuarioRole>(`/roles/${roleId}/participacao`, {
      method: "PATCH",
      body: JSON.stringify({ notificar }),
    }),

  cancelar: (roleId: string) =>
    api<void>(`/roles/${roleId}/participacao`, { method: "DELETE" }),
};
