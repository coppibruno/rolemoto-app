import { api, ApiError } from "@/lib/api";
import type { Usuario, UsuarioEdicao } from "@/types/user";

export const perfilService = {
  buscar: async (): Promise<Usuario | null> => {
    try {
      return await api<Usuario>("/perfil");
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  },

  atualizar: (dados: UsuarioEdicao) =>
    api<Usuario>("/perfil", {
      method: "PUT",
      body: JSON.stringify(dados),
    }),

  excluir: () =>
    api<void>("/perfil", {
      method: "DELETE",
    }),
};
