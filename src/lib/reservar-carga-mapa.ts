import { api } from "@/lib/api";

/** Reserva uma carga antes do script. Falha ou teto devolvem o mapa livre. */
export const reservarCargaMapa = async (): Promise<"google" | "osm"> => {
  try {
    const resposta = await api<{ provedor?: string }>("/mapas/carga", {
      method: "POST",
      body: "{}",
    });
    return resposta.provedor === "google" ? "google" : "osm";
  } catch {
    return "osm";
  }
};
