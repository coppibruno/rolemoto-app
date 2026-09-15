import { api } from "@/lib/api";
import type { Role, RoleModelo, RolePublicacao } from "@/types/role";

export const rolesService = {
  criar: (dados: RolePublicacao) =>
    api<Role>("/roles", {
      method: "POST",
      body: JSON.stringify(dados),
    }),

  atualizar: (id: string, dados: RolePublicacao) =>
    api<Role>(`/roles/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(dados),
    }),

  excluir: (id: string) =>
    api<void>(`/roles/${encodeURIComponent(id)}`, { method: "DELETE" }),

  buscarModelo: (roleId: string) =>
    api<RoleModelo>(`/roles/${encodeURIComponent(roleId)}/modelo`),
};
