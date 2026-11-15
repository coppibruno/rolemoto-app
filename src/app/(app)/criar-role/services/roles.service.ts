import { api } from "@/lib/api";
import type { Role, RoleModelo, RolePublicacao } from "@/types/role";

export const rolesService = {
  criar: (dados: RolePublicacao) =>
    api<Role>("/roles", {
      method: "POST",
      body: JSON.stringify(dados),
    }),

  atualizar: (id: string, dados: Omit<RolePublicacao, "acesso">) =>
    api<Role>(`/roles/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(dados),
    }),

  excluir: (id: string) =>
    api<void>(`/roles/${encodeURIComponent(id)}`, { method: "DELETE" }),

  fixar: (id: string, fixado: boolean) =>
    api<{ id: string; fixado: boolean }>(`/roles/${encodeURIComponent(id)}/fixado`, {
      method: "PATCH",
      body: JSON.stringify({ fixado }),
    }),

  buscarModelo: (roleId: string) =>
    api<RoleModelo>(`/roles/${encodeURIComponent(roleId)}/modelo`),
};
