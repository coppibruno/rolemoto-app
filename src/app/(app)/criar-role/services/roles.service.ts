import { api } from "@/lib/api";
import type { Role, RoleModelo, RolePublicacao } from "@/types/role";

export const rolesService = {
  criar: (dados: RolePublicacao) =>
    api<Role>("/roles", {
      method: "POST",
      body: JSON.stringify(dados),
    }),

  buscarModelo: (roleId: string) =>
    api<RoleModelo>(`/roles/${encodeURIComponent(roleId)}/modelo`),
};
