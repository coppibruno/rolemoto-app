import type {UsuarioAuth} from "./auth";

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioAuth;
    }
  }
}

export {};
