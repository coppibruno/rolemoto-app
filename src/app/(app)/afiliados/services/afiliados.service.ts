import { api } from "@/lib/api";
import type { Afiliado } from "@/types/afiliado";

export const afiliadosService = {
  listar: async (): Promise<Afiliado[]> =>
    (await api<{ itens: Afiliado[] }>("/afiliados")).itens ?? [],

  criar: (codigo: string, nome: string) =>
    api<Afiliado>("/afiliados", {
      method: "POST",
      body: JSON.stringify({ codigo, nome }),
    }),
};
