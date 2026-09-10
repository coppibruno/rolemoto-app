import type {Request} from "express";
import type {RitmoRole} from "../types/role";

export type QueryRolesValida = {
  lat: number;
  lng: number;
  raioKm?: 25 | 50 | 100;
  quando?: "hoje" | "amanha" | "fim_de_semana" | "data";
  data?: string;
  ritmo?: RitmoRole;
  q?: string;
};

export type QueryRolesInvalida = {
  status: 400;
  erro: string;
};

const QUANDOS = ["hoje", "amanha", "fim_de_semana", "data"] as const;
const RITMOS: RitmoRole[] = ["tranquila", "moderada", "agressiva"];
const RAIOS = [25, 50, 100] as const;
const DATA_YMD = /^\d{4}-\d{2}-\d{2}$/;

const str = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }
  return undefined;
};

const dataYmdValida = (ymd: string): boolean => {
  if (!DATA_YMD.test(ymd)) {
    return false;
  }
  const [ano, mes, dia] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    dt.getUTCFullYear() === ano &&
    dt.getUTCMonth() === mes - 1 &&
    dt.getUTCDate() === dia
  );
};

export const validarQueryRoles = (
  req: Request,
): QueryRolesValida | QueryRolesInvalida => {
  const latRaw = str(req.query.lat);
  const lngRaw = str(req.query.lng);

  if (latRaw === undefined || lngRaw === undefined || latRaw === "" || lngRaw === "") {
    return {status: 400, erro: "lat e lng são obrigatórios"};
  }

  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return {status: 400, erro: "lat e lng são obrigatórios"};
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return {status: 400, erro: "coordenadas inválidas"};
  }

  const resultado: QueryRolesValida = {lat, lng};

  const raioRaw = str(req.query.raioKm);
  if (raioRaw !== undefined && raioRaw !== "") {
    const raioKm = Number(raioRaw);
    if (!RAIOS.includes(raioKm as (typeof RAIOS)[number])) {
      return {status: 400, erro: "raioKm inválido"};
    }
    resultado.raioKm = raioKm as 25 | 50 | 100;
  }

  const quandoRaw = str(req.query.quando);
  if (quandoRaw !== undefined && quandoRaw !== "") {
    if (!(QUANDOS as readonly string[]).includes(quandoRaw)) {
      return {status: 400, erro: "quando inválido"};
    }
    const quando = quandoRaw as QueryRolesValida["quando"];
    resultado.quando = quando;
    if (quando === "data") {
      const data = str(req.query.data);
      if (!data || !dataYmdValida(data)) {
        return {status: 400, erro: "data é obrigatória"};
      }
      resultado.data = data;
    }
  }

  const ritmoRaw = str(req.query.ritmo);
  if (ritmoRaw !== undefined && ritmoRaw !== "" && ritmoRaw !== "todas") {
    if (!RITMOS.includes(ritmoRaw as RitmoRole)) {
      return {status: 400, erro: "ritmo inválido"};
    }
    resultado.ritmo = ritmoRaw as RitmoRole;
  }

  const q = str(req.query.q)?.trim();
  if (q) {
    resultado.q = q;
  }

  return resultado;
};
