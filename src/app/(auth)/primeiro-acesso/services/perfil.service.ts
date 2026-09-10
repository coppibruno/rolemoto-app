import { api } from "@/lib/api";
import type { Usuario, UsuarioPrimeiroAcesso } from "@/types/user";

export const perfilPrimeiroAcessoService = {
  criar: (dados: UsuarioPrimeiroAcesso) =>
    api<Usuario>("/perfil", {
      method: "POST",
      body: JSON.stringify(dados),
    }),
};
