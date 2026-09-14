import type { Localizacao } from "@/types/role";

export const tituloLocal = (local: Pick<Localizacao, "nome" | "endereco">): string =>
  (local.nome ?? "").trim() || local.endereco;

export const subtituloLocal = (
  local: Pick<Localizacao, "nome" | "endereco">,
): string | null => ((local.nome ?? "").trim() ? local.endereco : null);
