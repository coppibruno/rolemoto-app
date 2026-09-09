export type Pilotagem = "agressiva" | "moderada" | "tranquila";

/** Perfil do motociclista — sem tipos do Firebase. */
export interface Usuario {
  uid: string;
  nome: string;
  apelido: string;
  moto: string;
  pilotagem: Pilotagem;
  fotoUrl: string;
  cidade: string;
  createdAt: string;
}

export type UsuarioCreate = Omit<Usuario, "uid" | "createdAt">;
export type UsuarioUpdate = Partial<UsuarioCreate>;
