export type Pilotagem = "agressiva" | "moderada" | "tranquila";

export type TipoMoto = "trail" | "speed" | "custom";

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

export type UsuarioForm = Omit<Usuario, "uid" | "createdAt" | "admin">;

export type ErrosPrimeiroAcesso = {
  nome?: string;
  moto?: string;
  foto?: string;
  pilotagem?: string;
};

/** Body do POST /perfil — apelido, tipo, garupa e cidade completam depois no perfil. */
export type UsuarioPrimeiroAcesso = {
  nome: string;
  moto: string;
  pilotagem: Pilotagem;
  fotoUrl: string;
};

/** Payload de edição de perfil. */
export type UsuarioEdicao = {
  nome: string;
  apelido: string;
  fotoUrl: string;
  pilotagem: Pilotagem;
  moto: string;
  tipoMoto: TipoMoto | null;
  garupaFrequente: boolean;
  cidade: string;
};
