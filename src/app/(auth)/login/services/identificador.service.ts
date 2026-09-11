import { api } from "@/lib/api";

export const normalizarIdentificador = (valor: string) =>
  valor.trim().replace(/^@+/, "");

const pareceEmail = (valor: string) => valor.includes("@");

/**
 * E-mail digitado segue direto; apelido passa por POST /auth/resolver (sem Bearer).
 */
export const resolverEmailDaConta = async (identificador: string): Promise<string> => {
  const normalizado = normalizarIdentificador(identificador);
  if (!normalizado) {
    throw new Error("identificador vazio");
  }
  if (pareceEmail(normalizado)) {
    return normalizado;
  }
  const resposta = await api<{ email: string }>("/auth/resolver", {
    method: "POST",
    body: JSON.stringify({ identificador: normalizado }),
  });
  return resposta.email;
};
