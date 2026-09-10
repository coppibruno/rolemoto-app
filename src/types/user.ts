import { Timestamp } from "firebase/firestore";

export type Pilotagem = "agressiva" | "moderada" | "tranquila";

export interface Usuario {
  uid: string;
  nome: string;
  apelido: string;
  moto: string;
  pilotagem: Pilotagem;
  fotoUrl: string;
  cidade: string;
  garupaFrequente: boolean;
  createdAt: Timestamp;
}

export type UsuarioForm = Omit<Usuario, "uid" | "createdAt">;

export type PrimeiroAcessoForm = {
  nome: string;
  apelido: string;
  moto: string;
  garupaFrequente: boolean;
  photoFile: File | null;
  fotoUrlAtual: string;
  pilotagem: Pilotagem | null;
};

export type ErrosPrimeiroAcesso = {
  nome?: string;
  apelido?: string;
  moto?: string;
  foto?: string;
  pilotagem?: string;
};

/** Body do POST /perfil após upload (se houver). */
export type UsuarioPrimeiroAcesso = {
  nome: string;
  apelido: string;
  moto: string;
  pilotagem: Pilotagem;
  fotoUrl: string;
  garupaFrequente: boolean;
};

/** Payload de edição de perfil — os quatro campos são obrigatórios. */
export type UsuarioEdicao = {
  nome: string;
  apelido: string;
  fotoUrl: string;
  pilotagem: Pilotagem;
};
