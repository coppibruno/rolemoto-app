import {eDoComboio} from "./feedback";
import type {Role} from "../types/role";
import type {UsuarioRole} from "../types/usuario-role";
import type {TelemetriaRoleCreate} from "../types/telemetria-role";

const MAX_DURACAO_MS = 24 * 60 * 60 * 1000;
const MAX_DISTANCIA_KM = 2000;
const MAX_VELOCIDADE_KMH = 350;

export const idTelemetria = (usuarioId: string, roleId: string): string =>
  `${usuarioId}_${roleId}`;

export type TelemetriaBodyValidado = Omit<
  TelemetriaRoleCreate,
  "usuarioId" | "roleId"
>;

const isNumeroFinito = (valor: unknown): valor is number =>
  typeof valor === "number" && Number.isFinite(valor);

const isIso = (valor: unknown): valor is string =>
  typeof valor === "string" && Number.isFinite(Date.parse(valor));

const umaCasa = (n: number): number => Math.round(n * 10) / 10;
const duasCasas = (n: number): number => Math.round(n * 100) / 100;

export const podeGravarTelemetria = (
  uid: string,
  role: Role,
  pedido: UsuarioRole | null,
): boolean => eDoComboio(uid, role, pedido);

export const validarBodyTelemetria = (
  body: Record<string, unknown>,
):
  | {ok: true; dados: TelemetriaBodyValidado}
  | {ok: false; erro: string} => {
  const campos: Array<keyof TelemetriaBodyValidado> = [
    "velocidadeMaxKmh",
    "velocidadeMediaKmh",
    "distanciaKm",
    "tempoSegundos",
    "tempoMovimentoSegundos",
    "iniciadoEm",
    "encerradoEm",
  ];
  for (const campo of campos) {
    if (body[campo] === undefined) {
      return {ok: false, erro: `${campo} é obrigatório`};
    }
  }

  const numericos = [
    "velocidadeMaxKmh",
    "velocidadeMediaKmh",
    "distanciaKm",
    "tempoSegundos",
    "tempoMovimentoSegundos",
  ] as const;
  for (const campo of numericos) {
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

  return {
    ok: true,
    dados: {
      velocidadeMaxKmh,
      velocidadeMediaKmh,
      distanciaKm,
      tempoSegundos,
      tempoMovimentoSegundos,
      iniciadoEm: body.iniciadoEm,
      encerradoEm: body.encerradoEm,
    },
  };
};
