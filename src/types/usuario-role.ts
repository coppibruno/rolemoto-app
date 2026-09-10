export type UsuarioRole = {
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
};
