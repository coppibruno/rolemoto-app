import type {Response} from "express";

export const responderErro = (res: Response, error: unknown): void => {
  console.error(error);
  res.status(500).json({erro: "Erro interno"});
};
