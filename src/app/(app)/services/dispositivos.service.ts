import { api } from "@/lib/api";

export type Dispositivo = {
  token: string;
  uid: string;
  createdAt: string;
  updatedAt: string;
};

export const dispositivosService = {
  registrar: (token: string) =>
    api<Dispositivo>("/dispositivos", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  remover: (token: string) =>
    api<void>("/dispositivos", {
      method: "DELETE",
      body: JSON.stringify({ token }),
    }),
};
