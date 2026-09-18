export type UsuarioLocalFavorito = {
  id: string;
  usuarioId: string;
  localId: string;
  createdAt: string;
};

export type UsuarioLocalFavoritoCreate = {
  usuarioId: string;
  localId: string;
};
