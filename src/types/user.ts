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

export type PrimeiroAcessoForm = {
  nome: string;
  apelido: string;
  moto: string;
  tipoMoto: TipoMoto | null;
  garupaFrequente: boolean;
  photoFile: File | null;
  fotoUrlAtual: string;
  pilotagem: Pilotagem | null;
};

export type ErrosPrimeiroAcesso = {
  nome?: string;
  apelido?: string;
  moto?: string;
  tipoMoto?: string;
  foto?: string;
  pilotagem?: string;
};

/** Body do POST /perfil após upload (se houver). */
export type UsuarioPrimeiroAcesso = {
  nome: string;
  apelido: string;
  moto: string;
  tipoMoto: TipoMoto;
  pilotagem: Pilotagem;
  fotoUrl: string;
  garupaFrequente: boolean;
};

/** Payload de edição de perfil. */
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
