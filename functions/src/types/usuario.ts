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
  garupaFrequente: boolean;
  createdAt: string;
}

export type UsuarioCreate = Omit<Usuario, "uid" | "createdAt">;
export type UsuarioUpdate = Partial<UsuarioCreate>;

/** Body de POST /perfil — uid só do token; cidade nasce vazia. */
export type UsuarioPrimeiroAcesso = {
  nome: string;
  apelido: string;
  moto: string;
  pilotagem: Pilotagem;
  fotoUrl: string;
  garupaFrequente: boolean;
};

/** Edição autenticada do próprio perfil — quatro campos obrigatórios. */
export type UsuarioEdicao = {
  nome: string;
  apelido: string;
  fotoUrl: string;
  pilotagem: Pilotagem;
};
