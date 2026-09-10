import { api } from "@/lib/api";
import type { Usuario, UsuarioEdicao } from "@/types/user";

export const perfilService = {
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
