/** Vínculo usuário ↔ evento (coleção `usersevento`). Datas em ISO. */
export type UsuarioEvento = {
  id: string;
  usuarioId: string;
  eventoId: string;
  criadorId: string;
  createdAt: string;
  updatedAt: string;
};
