import { api } from "@/lib/api";
import type { UsuarioLocalFavorito } from "@/types/favorito-local";

export const favoritoLocalService = {
  favoritar: (localId: string) =>
    api<UsuarioLocalFavorito>(`/locais/${localId}/favorito`, {
      method: "POST",
    }),
  desfavoritar: (localId: string) =>
    api<void>(`/locais/${localId}/favorito`, { method: "DELETE" }),
};
