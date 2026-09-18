export type Pilotagem = "agressiva" | "moderada" | "tranquila";

export type TipoMoto = "trail" | "speed" | "custom";

/** Perfil do motociclista — sem tipos do Firebase. */
export interface Usuario {
  uid: string;
  nome: string;
  apelido: string;
  moto: string;
  /** Legado sem campo → null até o próximo save. */
  tipoMoto: TipoMoto | null;
  pilotagem: Pilotagem;
  fotoUrl: string;
  cidade: string;
  garupaFrequente: boolean;
  admin: boolean;
  createdAt: string;
}

/** DTO público — sem admin, e-mail ou dados sensíveis. */
export type PerfilPublico = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
  moto: string;
  tipoMoto: TipoMoto | null;
  pilotagem: Pilotagem;
  cidade: string;
  garupaFrequente: boolean;
};

export type UsuarioCreate = Omit<Usuario, "uid" | "createdAt" | "tipoMoto"> & {
  tipoMoto: TipoMoto;
};

export type UsuarioUpdate = Partial<Omit<UsuarioCreate, "admin">>;

/** Body de POST /perfil — uid só do token; cidade nasce vazia. */
export type UsuarioPrimeiroAcesso = {
  nome: string;
  apelido: string;
  moto: string;
  tipoMoto: TipoMoto;
  pilotagem: Pilotagem;
  fotoUrl: string;
  garupaFrequente: boolean;
};

/** Edição autenticada do próprio perfil — campos obrigatórios. */
export type UsuarioEdicao = {
  nome: string;
  apelido: string;
  fotoUrl: string;
  pilotagem: Pilotagem;
  moto: string;
  tipoMoto: TipoMoto;
  garupaFrequente: boolean;
  cidade: string;
};
