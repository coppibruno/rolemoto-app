/** Usuário autenticado extraído do token (não vem do banco). */
export interface UsuarioAuth {
  uid: string;
  email?: string;
  claims: Record<string, unknown>;
}
