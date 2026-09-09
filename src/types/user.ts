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
  createdAt: Timestamp;
}

export type UsuarioForm = Omit<Usuario, "uid" | "createdAt">;

export type PrimeiroAcessoForm = {
  nome: string;
  apelido: string;
  moto: string;
  pilotagem: Pilotagem;
  foto?: File;
};
