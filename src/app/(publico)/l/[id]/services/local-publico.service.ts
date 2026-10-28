import { cache } from "react";
import { functionsApiUrl } from "@/lib/firebase";
import type { LocalPublico } from "@/types/local-publico";

export const obterLocalPublico = cache(
  async (id: string): Promise<LocalPublico | null> => {
    const res = await fetch(`${functionsApiUrl}/publico/locais/${id}`, {
      next: { revalidate: 60, tags: [`local-publico-${id}`] },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Falha ao carregar o convite");
    return res.json() as Promise<LocalPublico>;
  },
);
