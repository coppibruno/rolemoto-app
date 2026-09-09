import type {UsuarioAuth} from "../types/auth";

/** Custom claim `admin: true` no token do Firebase Auth. */
export const isAdmin = (usuario: UsuarioAuth): boolean =>
  usuario.claims.admin === true;

/** Criador do recurso ou administrador. */
export const isDonoOuAdmin = (
  usuario: UsuarioAuth,
  criadorId: string,
): boolean => usuario.uid === criadorId || isAdmin(usuario);
