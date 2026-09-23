import type { User } from "firebase/auth";
import type { Usuario } from "@/types/user";
import { precisaDefinirSenha } from "./credenciais-login";
import {
  destinoSeguro,
  urlDefinirSenhaComNext,
  urlPrimeiroAcessoComNext,
} from "./destino-pos-auth";

export const destinoAposAuth = (
  firebaseUser: User,
  usuario: Usuario | null,
  next: string | null,
) => {
  const destino = destinoSeguro(next);
  if (precisaDefinirSenha(firebaseUser)) {
    return urlDefinirSenhaComNext(destino);
  }
  return usuario ? destino : urlPrimeiroAcessoComNext(destino);
};

export const destinoAposDefinirSenha = (
  usuario: Usuario | null,
  next: string | null,
) => {
  const destino = destinoSeguro(next);
  return usuario ? destino : urlPrimeiroAcessoComNext(destino);
};
