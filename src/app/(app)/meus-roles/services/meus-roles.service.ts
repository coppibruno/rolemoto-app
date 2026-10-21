import { api } from "@/lib/api";
import type {
  MeusEventosGaragemPayload,
  MeusLocaisGaragemPayload,
  MeusRolesPayload,
  RecorteLocaisGaragem,
} from "@/types/meus-roles";

export const meusRolesService = {
  listar: () => api<MeusRolesPayload>("/meus-roles"),
  listarEventos: () =>
    api<MeusEventosGaragemPayload>("/meus-roles/eventos"),
  listarLocais: (recorte: RecorteLocaisGaragem = "favoritos") =>
    api<MeusLocaisGaragemPayload>(
      recorte === "visitados"
        ? "/meus-roles/locais?recorte=visitados"
        : "/meus-roles/locais",
    ),
};
