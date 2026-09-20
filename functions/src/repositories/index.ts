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
import {FirestoreEventoRepository} from "./firestore/firestore-evento.repository";
import {FirestoreUsuarioEventoRepository} from "./firestore/firestore-usuario-evento.repository";
import {FirestoreLocalRepository} from "./firestore/firestore-local.repository";
import {
  FirestoreUsuarioLocalFeedbackRepository,
} from "./firestore/firestore-usuario-local-feedback.repository";
import {
  FirestoreUsuarioEventoFeedbackRepository,
} from "./firestore/firestore-usuario-evento-feedback.repository";
import {
  FirestoreUsuarioLocalFavoritoRepository,
} from "./firestore/firestore-usuario-local-favorito.repository";
import {
  FirestoreRoleTelemetriaRepository,
} from "./firestore/firestore-role-telemetria.repository";
import type {UsuarioRepository} from "./interfaces/usuario.repository";
import type {RoleRepository} from "./interfaces/role.repository";
import type {UsuarioRoleRepository} from "./interfaces/usuario-role.repository";
import type {
  UsuarioRoleFeedbackRepository,
} from "./interfaces/usuario-role-feedback.repository";
import type {DispositivoRepository} from "./interfaces/dispositivo.repository";
import type {EventoRepository} from "./interfaces/evento.repository";
import type {UsuarioEventoRepository} from "./interfaces/usuario-evento.repository";
import type {LocalRepository} from "./interfaces/local.repository";
import type {
  UsuarioLocalFeedbackRepository,
} from "./interfaces/usuario-local-feedback.repository";
import type {
  UsuarioEventoFeedbackRepository,
} from "./interfaces/usuario-evento-feedback.repository";
import type {
  UsuarioLocalFavoritoRepository,
} from "./interfaces/usuario-local-favorito.repository";
import type {RoleTelemetriaRepository} from "./interfaces/role-telemetria.repository";

export const usuarioRepository: UsuarioRepository =
  new FirestoreUsuarioRepository();

export const roleRepository: RoleRepository = new FirestoreRoleRepository();

export const usuarioRoleRepository: UsuarioRoleRepository =
  new FirestoreUsuarioRoleRepository();

export const usuarioRoleFeedbackRepository: UsuarioRoleFeedbackRepository =
  new FirestoreUsuarioRoleFeedbackRepository();

export const dispositivoRepository: DispositivoRepository =
  new FirestoreDispositivoRepository();

export const eventoRepository: EventoRepository =
  new FirestoreEventoRepository();

export const usuarioEventoRepository: UsuarioEventoRepository =
  new FirestoreUsuarioEventoRepository();

export const localRepository: LocalRepository =
  new FirestoreLocalRepository();

export const usuarioLocalFeedbackRepository: UsuarioLocalFeedbackRepository =
  new FirestoreUsuarioLocalFeedbackRepository();

export const usuarioEventoFeedbackRepository: UsuarioEventoFeedbackRepository =
  new FirestoreUsuarioEventoFeedbackRepository();

export const usuarioLocalFavoritoRepository: UsuarioLocalFavoritoRepository =
  new FirestoreUsuarioLocalFavoritoRepository();

export const roleTelemetriaRepository: RoleTelemetriaRepository =
  new FirestoreRoleTelemetriaRepository();
