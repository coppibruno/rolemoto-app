import { api } from "@/lib/api";
import type { MeusRolesPayload } from "@/types/meus-roles";

export const meusRolesService = {
  listar: () => api<MeusRolesPayload>("/meus-roles"),
};
