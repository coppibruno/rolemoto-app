import type {Request} from "express";
import type {QueryRolesInvalida, QueryRolesValida} from "./roles-query";
import {validarQueryRoles} from "./roles-query";

export type QueryGeoFeed = Omit<QueryRolesValida, "ritmo">;

/**
 * Valida lat/lng/raio/quando/data/q (sem ritmo).
 * Reusa as mesmas regras de GET /roles.
 */
export const validarQueryGeoFeed = (
  req: Request,
): QueryGeoFeed | QueryRolesInvalida => {
  const base = validarQueryRoles(req);
  if ("erro" in base) {
    return base;
  }
  return {
    lat: base.lat,
    lng: base.lng,
    ...(base.raioKm !== undefined ? {raioKm: base.raioKm} : {}),
    ...(base.quando !== undefined ? {quando: base.quando} : {}),
    ...(base.data !== undefined ? {data: base.data} : {}),
    ...(base.q !== undefined ? {q: base.q} : {}),
  };
};

/**
 * Lat/lng opcionais: se ambos ausentes, retorno null (modo catálogo).
 * Se só um vier, 400.
 */
export const validarQueryGeoOpcional = (
  req: Request,
): QueryGeoFeed | QueryRolesInvalida | null => {
  const latRaw = req.query.lat;
  const lngRaw = req.query.lng;
  const latStr =
    typeof latRaw === "string" ?
      latRaw :
      Array.isArray(latRaw) && typeof latRaw[0] === "string" ?
        latRaw[0] :
        undefined;
  const lngStr =
    typeof lngRaw === "string" ?
      lngRaw :
      Array.isArray(lngRaw) && typeof lngRaw[0] === "string" ?
        lngRaw[0] :
        undefined;

  const latVazio = latStr === undefined || latStr === "";
  const lngVazio = lngStr === undefined || lngStr === "";

  if (latVazio && lngVazio) {
    return null;
  }
  if (latVazio || lngVazio) {
    return {status: 400, erro: "lat e lng são obrigatórios"};
  }

  return validarQueryGeoFeed(req);
};
