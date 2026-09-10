/** Vínculo usuário ↔ rolê (coleção `usersrole`). Datas em ISO. */
export interface UsuarioRole {
  id: string;
  usuarioId: string;
  roleId: string;
  criadorId: string;
  aceito: boolean;
  notificar: boolean;
  createdAt: string;
  updatedAt: string;
  aceitoEm: string | null;
  recusadoEm: string | null;
}

export type UsuarioRoleCreate = {
  usuarioId: string;
  roleId: string;
  criadorId: string;
};

export type UsuarioRoleNotificar = {
  notificar: boolean;
};

export type UsuarioRoleDecisao = {
  decisao: "aceitar" | "recusar";
};
