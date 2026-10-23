import { cache } from "react";
import { functionsApiUrl } from "@/lib/firebase";
import type { EventoPublico } from "@/types/evento-publico";

export const obterEventoPublico = cache(
  async (id: string): Promise<EventoPublico | null> => {
    const res = await fetch(`${functionsApiUrl}/publico/eventos/${id}`, {
      next: { revalidate: 60, tags: [`evento-publico-${id}`] },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Falha ao carregar o convite");
    return res.json() as Promise<EventoPublico>;
  },
);
