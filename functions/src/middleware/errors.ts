import type {Response} from "express";
import {erroDe, log} from "../lib/log";

export const responderErro = (
  res: Response,
  error: unknown,
  contexto?: Record<string, unknown>,
): void => {
  log.error("Api", "Erro interno", {...contexto, ...erroDe(error)});
  res.status(500).json({erro: "Erro interno"});
};
