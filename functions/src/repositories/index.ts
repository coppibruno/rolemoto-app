/**
 * Factory dos repositórios.
 *
 * Rotas dependem das interfaces, não do Firestore.
 * Para trocar o banco, substitua as implementações neste arquivo.
 */
import {FirestoreUsuarioRepository} from "./firestore/firestore-usuario.repository";
import {FirestoreRoleRepository} from "./firestore/firestore-role.repository";
import type {UsuarioRepository} from "./interfaces/usuario.repository";
import type {RoleRepository} from "./interfaces/role.repository";

export const usuarioRepository: UsuarioRepository =
  new FirestoreUsuarioRepository();

export const roleRepository: RoleRepository = new FirestoreRoleRepository();
