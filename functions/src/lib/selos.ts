import type {AgregadoCheckinUsuario, CheckinsPorCategoria} from "../types/checkin-local";
import type {CategoriaLocal} from "../types/local";
import {CATEGORIAS_LOCAL} from "../types/local";
import type {SeloPublico} from "../types/selo";

export const categoriasZeradas = (): CheckinsPorCategoria => {
  const base = {} as CheckinsPorCategoria;
  for (const categoria of CATEGORIAS_LOCAL) {
    base[categoria] = 0;
  }
  return base;
};

export const agregadoCheckinVazio = (): AgregadoCheckinUsuario => ({
  locaisVisitadosUnicos: 0,
  locaisVisitadosIds: [],
  checkinsPorCategoria: categoriasZeradas(),
  selos: [],
});

export const isSeloPublico = (valor: unknown): valor is SeloPublico => {
  if (!valor || typeof valor !== "object") {
    return false;
  }
  const bruto = valor as Record<string, unknown>;
  return (
    typeof bruto.localId === "string" &&
    bruto.localId.length > 0 &&
    typeof bruto.nome === "string" &&
    bruto.nome.trim().length > 0 &&
    typeof bruto.categoria === "string" &&
    (CATEGORIAS_LOCAL as string[]).includes(bruto.categoria)
  );
};

export const normalizarSelos = (valor: unknown): SeloPublico[] => {
  if (!Array.isArray(valor)) {
    return [];
  }
  return valor.filter(isSeloPublico).map((item) => ({
    localId: item.localId,
    nome: item.nome.trim(),
    categoria: item.categoria,
  }));
};

export const paraSeloDoLocal = (
  localId: string,
  nome: string,
  categoria: CategoriaLocal,
): SeloPublico => ({
  localId,
  nome: nome.trim(),
  categoria,
});

export const aplicarCheckinUnico = (
  atual: AgregadoCheckinUsuario,
  localId: string,
  nome: string,
  categoria: CategoriaLocal,
): AgregadoCheckinUsuario => {
  const selo = paraSeloDoLocal(localId, nome, categoria);
  const jaVisitou = atual.locaisVisitadosIds.includes(localId);
  const jaTemSelo = atual.selos.some((item) => item.localId === localId);
  if (jaVisitou && jaTemSelo) {
    return atual;
  }

  const selos = [
    selo,
    ...atual.selos.filter((item) => item.localId !== localId),
  ];

  if (jaVisitou) {
    return {...atual, selos};
  }

  const checkinsPorCategoria = {
    ...atual.checkinsPorCategoria,
    [categoria]: (atual.checkinsPorCategoria[categoria] ?? 0) + 1,
  };
  const locaisVisitadosIds = [...atual.locaisVisitadosIds, localId];
  return {
    locaisVisitadosUnicos: locaisVisitadosIds.length,
    locaisVisitadosIds,
    checkinsPorCategoria,
    selos,
  };
};
