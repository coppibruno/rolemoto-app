import { api } from "@/lib/api";
import type {
  MeusEventosGaragemPayload,
  MeusLocaisGaragemPayload,
  MeusRolesPayload,
} from "@/types/meus-roles";

export const meusRolesService = {
  listar: () => api<MeusRolesPayload>("/meus-roles"),
  listarEventos: () =>
    api<MeusEventosGaragemPayload>("/meus-roles/eventos"),
  listarLocais: () => api<MeusLocaisGaragemPayload>("/meus-roles/locais"),
};
