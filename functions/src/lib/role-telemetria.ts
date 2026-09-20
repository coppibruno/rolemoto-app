import type {
  ItemHistoricoTelemetria,
  PontoTelemetria,
  RoleTelemetria,
  RoleTelemetriaCreate,
} from "../types/role-telemetria";

const MAX_DURACAO_MS = 24 * 60 * 60 * 1000;
const MAX_DISTANCIA_KM = 2000;
const MAX_VELOCIDADE_KMH = 350;
const TITULO_MAX = 80;
const TEXTO_PONTO_MAX = 200;
const TZ = "America/Sao_Paulo";

const isNumeroFinito = (valor: unknown): valor is number =>
  typeof valor === "number" && Number.isFinite(valor);

const isIso = (valor: unknown): valor is string =>
  typeof valor === "string" && Number.isFinite(Date.parse(valor));

const umaCasa = (n: number): number => Math.round(n * 10) / 10;
const duasCasas = (n: number): number => Math.round(n * 100) / 100;

export const tituloDefaultTelemetria = (encerradoEm: string): string => {
  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(encerradoEm));
  const valor = (tipo: Intl.DateTimeFormatPartTypes): string =>
    partes.find((p) => p.type === tipo)?.value ?? "";
  return `Rolê · ${valor("day")}/${valor("month")} ${valor("hour")}:${valor("minute")}`;
};

const validarPonto = (
  valor: unknown,
  campo: string,
): {ok: true; ponto: PontoTelemetria} | {ok: false; erro: string} => {
  if (!valor || typeof valor !== "object") {
    return {ok: false, erro: `${campo} é obrigatório`};
  }
  const o = valor as Record<string, unknown>;
  if (!isNumeroFinito(o.lat) || o.lat < -90 || o.lat > 90) {
    return {ok: false, erro: `${campo}.lat inválido`};
  }
  if (!isNumeroFinito(o.lng) || o.lng < -180 || o.lng > 180) {
    return {ok: false, erro: `${campo}.lng inválido`};
  }
  const nome = o.nome === undefined || o.nome === null ? "" : o.nome;
  const endereco =
    o.endereco === undefined || o.endereco === null ? "" : o.endereco;
  if (typeof nome !== "string" || nome.length > TEXTO_PONTO_MAX) {
    return {ok: false, erro: `${campo}.nome inválido`};
  }
  if (typeof endereco !== "string" || endereco.length > TEXTO_PONTO_MAX) {
    return {ok: false, erro: `${campo}.endereco inválido`};
  }
  return {
    ok: true,
    ponto: {
      lat: o.lat,
      lng: o.lng,
      nome: nome.trim(),
      endereco: endereco.trim(),
    },
  };
};

export const validarBodyRoleTelemetria = (
  body: Record<string, unknown>,
):
  | {ok: true; dados: RoleTelemetriaCreate}
  | {ok: false; erro: string} => {
  const numericos = [
    "velocidadeMaxKmh",
    "velocidadeMediaKmh",
    "distanciaKm",
    "tempoSegundos",
    "tempoMovimentoSegundos",
  ] as const;
  for (const campo of numericos) {
    if (body[campo] === undefined) {
      return {ok: false, erro: `${campo} é obrigatório`};
    }
    if (!isNumeroFinito(body[campo]) || body[campo] < 0) {
      return {ok: false, erro: `${campo} inválido`};
    }
  }

  if (!isIso(body.iniciadoEm) || !isIso(body.encerradoEm)) {
    return {ok: false, erro: "timestamps inválidos"};
  }

  const iniciadoMs = Date.parse(body.iniciadoEm);
  const encerradoMs = Date.parse(body.encerradoEm);
  if (encerradoMs <= iniciadoMs) {
    return {ok: false, erro: "encerradoEm deve ser posterior a iniciadoEm"};
  }
  if (encerradoMs - iniciadoMs > MAX_DURACAO_MS) {
    return {ok: false, erro: "duração máxima é 24 h"};
  }

  const tempoSegundos = Math.floor(body.tempoSegundos as number);
  const tempoMovimentoSegundos = Math.floor(
    body.tempoMovimentoSegundos as number,
  );
  if (tempoMovimentoSegundos > tempoSegundos) {
    return {ok: false, erro: "tempoMovimentoSegundos maior que tempoSegundos"};
  }

  const distanciaKm = duasCasas(body.distanciaKm as number);
  const velocidadeMaxKmh = umaCasa(body.velocidadeMaxKmh as number);
  const velocidadeMediaKmh = umaCasa(body.velocidadeMediaKmh as number);

  if (distanciaKm > MAX_DISTANCIA_KM) {
    return {ok: false, erro: "distanciaKm acima do limite"};
  }
  if (velocidadeMaxKmh > MAX_VELOCIDADE_KMH) {
    return {ok: false, erro: "velocidadeMaxKmh acima do limite"};
  }

  const inicio = validarPonto(body.pontoInicio, "pontoInicio");
  if (!inicio.ok) {
    return inicio;
  }
  const fim = validarPonto(body.pontoFim, "pontoFim");
  if (!fim.ok) {
    return fim;
  }

  const tituloBruto = typeof body.titulo === "string" ? body.titulo.trim() : "";
  if (tituloBruto.length > TITULO_MAX) {
    return {ok: false, erro: "titulo inválido"};
  }
  const titulo =
    tituloBruto.length > 0 ?
      tituloBruto :
      tituloDefaultTelemetria(body.encerradoEm);

  return {
    ok: true,
    dados: {
      titulo,
      velocidadeMaxKmh,
      velocidadeMediaKmh,
      distanciaKm,
      tempoSegundos,
      tempoMovimentoSegundos,
      iniciadoEm: body.iniciadoEm,
      encerradoEm: body.encerradoEm,
      pontoInicio: inicio.ponto,
      pontoFim: fim.ponto,
    },
  };
};

export const paraItemHistoricoTelemetria = (
  doc: RoleTelemetria,
): ItemHistoricoTelemetria => ({
  id: doc.id,
  tipo: "telemetria",
  titulo: doc.titulo,
  distanciaKm: doc.distanciaKm,
  tempoSegundos: doc.tempoSegundos,
  encerradoEm: doc.encerradoEm,
});

export const parseLimiteTelemetria = (raw: unknown): number => {
  const n = typeof raw === "string" ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n) || n < 1) {
    return 50;
  }
  return Math.min(n, 100);
};
