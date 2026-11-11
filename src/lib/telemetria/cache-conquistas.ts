import { Preferences } from "@capacitor/preferences";
import { api } from "@/lib/api";
import type { ConquistaCatalogo } from "@/types/conquista";

const KEY_CATALOGO = "rolemoto.conquistas.catalogo";

const itemValido = (valor: unknown): valor is ConquistaCatalogo => {
  if (!valor || typeof valor !== "object") return false;
  const o = valor as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.nome === "string" &&
    Number.isFinite(o.lat) &&
    Number.isFinite(o.lng) &&
    Number.isFinite(o.raioMetros)
  );
};

/** Só o que o `GET /conquistas` devolve; nenhuma velocidade de ninguém. */
const limpar = (itens: unknown): ConquistaCatalogo[] =>
  (Array.isArray(itens) ? itens : []).filter(itemValido).map((c) => ({
    id: c.id,
    nome: c.nome,
    lat: c.lat,
    lng: c.lng,
    raioMetros: c.raioMetros,
  }));

/** Baixa o catálogo ativo se houver rede. Falha mantém o cache anterior. */
export const atualizarCacheConquistas = async (): Promise<void> => {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  try {
    const { itens } = await api<{ itens: unknown }>("/conquistas");
    await Preferences.set({ key: KEY_CATALOGO, value: JSON.stringify(limpar(itens)) });
  } catch {
    /* sem rede ou sem sessão: a serra usa o que já está salvo */
  }
};

export const lerCacheConquistas = async (): Promise<ConquistaCatalogo[]> => {
  try {
    const { value } = await Preferences.get({ key: KEY_CATALOGO });
    return value ? limpar(JSON.parse(value)) : [];
  } catch {
    return [];
  }
};
