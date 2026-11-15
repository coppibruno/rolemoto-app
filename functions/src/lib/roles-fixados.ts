import {paraFixadoResumo} from "./acesso-role";
import {erroDe, log} from "./log";
import {roleRepository} from "../repositories";
import type {RoleFixadoResumo} from "../types/role";
import {TETO_ROLES_FIXADOS} from "../types/role";

/** Perfil não cai se a faixa falhar (índice em construção, por exemplo): segue com `[]`. */
export const rolesFixadosDe = async (uid: string): Promise<RoleFixadoResumo[]> => {
  try {
    const roles = await roleRepository.listarFixadosPorCriador(uid, TETO_ROLES_FIXADOS);
    return roles.map(paraFixadoResumo);
  } catch (error) {
    log.warn("Perfil", "Rolês fixados indisponíveis", {uid, ...erroDe(error)});
    return [];
  }
};
