import type {NextFunction, Request, Response} from "express";
import {log} from "../lib/log";

type Entrada = {count: number; resetAt: number};

const store = new Map<string, Entrada>();

const JANELA_PADRAO_MS = 60_000;

const limparExpirados = (agora: number): void => {
  for (const [chave, entrada] of store) {
    if (entrada.resetAt <= agora) {
      store.delete(chave);
    }
  }
};

export const ipDoRequest = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
};

type OpcoesRateLimit = {
  max: number;
  janelaMs?: number;
  /** Prefixo para isolar buckets (ex.: "auth-resolver"). */
  nome: string;
  /** Chave customizada; default = IP. */
  chave?: (req: Request) => string;
};

/**
 * Rate limit in-memory por instância da function.
 * Responde 429 quando o limite da janela é excedido.
 */
export const rateLimit = (
  opcoes: OpcoesRateLimit,
): ((req: Request, res: Response, next: NextFunction) => void) => {
  const janelaMs = opcoes.janelaMs ?? JANELA_PADRAO_MS;

  return (req: Request, res: Response, next: NextFunction): void => {
    const agora = Date.now();
    if (store.size > 10_000) {
      limparExpirados(agora);
    }

    const identidade = opcoes.chave ? opcoes.chave(req) : ipDoRequest(req);
    const chave = `${opcoes.nome}:${identidade}`;
    let entrada = store.get(chave);

    if (!entrada || entrada.resetAt <= agora) {
      entrada = {count: 0, resetAt: agora + janelaMs};
      store.set(chave, entrada);
    }

    entrada.count += 1;
    if (entrada.count > opcoes.max) {
      log.warn("RateLimit", "Limite excedido", {
        bucket: opcoes.nome,
        identidade,
      });
      res.status(429).json({erro: "muitas requisições"});
      return;
    }

    next();
  };
};

/** 120 req/min por uid autenticado (fallback IP). */
export const rateLimitAutenticado = rateLimit({
  nome: "autenticado",
  max: 120,
  chave: (req) => req.usuario?.uid ?? ipDoRequest(req),
});

/**
 * Pontos GPS nativos (Capgo) — frequência alta com distanceFilter baixo.
 * 600/min por IP+sessão.
 */
export const rateLimitPontoTelemetria = rateLimit({
  nome: "telemetria-ponto",
  max: 600,
  chave: (req) => {
    const sessao = String(req.params.id ?? "");
    return `${ipDoRequest(req)}:${sessao}`;
  },
});
