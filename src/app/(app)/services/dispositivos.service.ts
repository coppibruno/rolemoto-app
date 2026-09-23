import { api } from "@/lib/api";
import type { Dispositivo, PlataformaDispositivo } from "@/types/dispositivo";

export type { Dispositivo, PlataformaDispositivo };

export const dispositivosService = {
  registrar: (
    token: string,
    plataforma: PlataformaDispositivo = "web",
  ) =>
    api<Dispositivo>("/dispositivos", {
      method: "POST",
      body: JSON.stringify({ token, plataforma }),
    }),

  remover: (token: string) =>
    api<void>("/dispositivos", {
      method: "DELETE",
      body: JSON.stringify({ token }),
    }),
};
