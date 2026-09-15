import {origemApp} from "./origem";

const ORIGENS_FIXAS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://rolemoto-bc47f.web.app",
  "https://rolemoto-bc47f.firebaseapp.com",
  "https://rolemoto.com.br",
  "https://www.rolemoto.com.br",
] as const;

/** Origins permitidos no CORS da function `api`. */
export const corsOrigins = (): string[] => {
  const set = new Set<string>(ORIGENS_FIXAS);
  const app = origemApp();
  if (app) {
    set.add(app);
  }
  return [...set];
};
