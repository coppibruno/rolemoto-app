/**
 * Factory dos repositórios.
 *
 * Rotas dependem das interfaces, não do Firestore.
 * Para trocar o banco, substitua as implementações neste arquivo.
 */
import {FirestoreUsuarioRepository} from "./firestore/firestore-usuario.repository";
import {FirestoreRoleRepository} from "./firestore/firestore-role.repository";
import {FirestoreUsuarioRoleRepository} from "./firestore/firestore-usuario-role.repository";
import {
  FirestoreUsuarioRoleFeedbackRepository,
} from "./firestore/firestore-usuario-role-feedback.repository";
import {FirestoreDispositivoRepository} from "./firestore/firestore-dispositivo.repository";
import type {UsuarioRepository} from "./interfaces/usuario.repository";
import type {RoleRepository} from "./interfaces/role.repository";
import type {UsuarioRoleRepository} from "./interfaces/usuario-role.repository";
import type {
  UsuarioRoleFeedbackRepository,
} from "./interfaces/usuario-role-feedback.repository";
import type {DispositivoRepository} from "./interfaces/dispositivo.repository";

export const usuarioRepository: UsuarioRepository =
  new FirestoreUsuarioRepository();

export const roleRepository: RoleRepository = new FirestoreRoleRepository();

export const usuarioRoleRepository: UsuarioRoleRepository =
  new FirestoreUsuarioRoleRepository();

export const usuarioRoleFeedbackRepository: UsuarioRoleFeedbackRepository =
  new FirestoreUsuarioRoleFeedbackRepository();

export const dispositivoRepository: DispositivoRepository =
  new FirestoreDispositivoRepository();
