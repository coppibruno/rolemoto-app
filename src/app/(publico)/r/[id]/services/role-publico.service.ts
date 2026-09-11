import { cache } from "react";
import { functionsApiUrl } from "@/lib/firebase";
import type { RolePublico } from "@/types/role-publico";

export const obterRolePublico = cache(
  async (id: string): Promise<RolePublico | null> => {
    const res = await fetch(`${functionsApiUrl}/publico/roles/${id}`, {
      next: { revalidate: 60, tags: [`role-publico-${id}`] },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Falha ao carregar o convite");
    return res.json() as Promise<RolePublico>;
  },
);
