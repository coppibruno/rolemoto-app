import type {AcessoRole, Role, RoleFixadoResumo} from "../types/role";

export const ERRO_ACESSO = "acesso inválido";
export const ERRO_TETO_FIXADOS = "Você já fixou 12 rolês";

/** Ausente vira `aberto`; `null` = valor fora do contrato (400). */
export const parseAcesso = (bruto: unknown): AcessoRole | null => {
  if (bruto === undefined || bruto === null) {
    return "aberto";
  }
  return bruto === "aberto" || bruto === "fechado" ? bruto : null;
};

/** O criador clona o próprio; outra pessoa só reutiliza rolê fixado. */
export const podeUsarModelo = (
  role: Pick<Role, "criadorId" | "fixado">,
  dono: boolean,
): boolean => dono || role.fixado;

export const paraFixadoResumo = (role: Role): RoleFixadoResumo => ({
  id: role.id,
  titulo: role.titulo,
  dataHoraSaida: role.dataHoraSaida,
  fotoCapaUrl: role.fotoCapaUrl,
  acesso: role.acesso,
});
