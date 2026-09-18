/** Vínculo usuário ↔ evento (coleção `usersevento`). Datas em ISO. */
export interface UsuarioEvento {
  id: string;
  usuarioId: string;
  eventoId: string;
  criadorId: string;
  createdAt: string;
  updatedAt: string;
}

export type UsuarioEventoCreate = {
  usuarioId: string;
  eventoId: string;
  criadorId: string;
};
