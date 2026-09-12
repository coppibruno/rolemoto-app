import { api } from "@/lib/api";

export const solicitarResetSenha = (identificador: string) =>
  api<void>("/auth/recuperar-senha", {
    method: "POST",
    body: JSON.stringify({ identificador }),
  });
