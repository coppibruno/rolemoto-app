import type {Request} from "express";

/** Express 5 tipa params como `string | string[]`. */
export const param = (req: Request, nome: string): string => {
  const value = req.params[nome];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
};
