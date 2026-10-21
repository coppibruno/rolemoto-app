import type {CategoriaLocal} from "../types/local";
import {CATEGORIAS_LOCAL} from "../types/local";
import type {AgregadoCheckinUsuario, CheckinsPorCategoria} from "../types/checkin-local";
import type {SeloId, SeloPublico} from "../types/selo";

export const CATALOGO_SELOS: {id: SeloId; label: string}[] = [
  {id: "primeira_parada", label: "Primeira parada"},
  {id: "postos_da_estrada", label: "Postos da estrada"},
  {id: "moto_point", label: "Moto point"},
  {id: "cacador_de_vista", label: "Caçador de vista"},
  {id: "parada_de_fome", label: "Parada de fome"},
  {id: "oficina_confianca", label: "Oficina de confiança"},
  {id: "rodou_o_mapa", label: "Rodou o mapa"},
];

const LABEL_POR_ID: Record<SeloId, string> = Object.fromEntries(
  CATALOGO_SELOS.map((item) => [item.id, item.label]),
) as Record<SeloId, string>;

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

export const computarSelos = (
  unicos: number,
  porCategoria: CheckinsPorCategoria,
): SeloId[] => {
  const selos: SeloId[] = [];
  if (unicos >= 1) selos.push("primeira_parada");
  if (porCategoria.posto >= 3) selos.push("postos_da_estrada");
  if (porCategoria.bar_moto_point >= 3) selos.push("moto_point");
  if (porCategoria.mirante >= 3) selos.push("cacador_de_vista");
  if (porCategoria.restaurante_estrada >= 3) selos.push("parada_de_fome");
  if (porCategoria.oficina >= 1) selos.push("oficina_confianca");
  if (unicos >= 10) selos.push("rodou_o_mapa");
  return selos;
};

export const paraSelosPublicos = (ids: SeloId[]): SeloPublico[] =>
  ids.map((id) => ({id, label: LABEL_POR_ID[id] ?? id}));

export const seloNovoEntre = (
  antes: SeloId[],
  depois: SeloId[],
): SeloPublico | null => {
  const vistos = new Set(antes);
  const novo = depois.find((id) => !vistos.has(id));
  return novo ? {id: novo, label: LABEL_POR_ID[novo] ?? novo} : null;
};

export const aplicarCheckinUnico = (
  atual: AgregadoCheckinUsuario,
  localId: string,
  categoria: CategoriaLocal,
): AgregadoCheckinUsuario => {
  if (atual.locaisVisitadosIds.includes(localId)) {
    return atual;
  }
  const checkinsPorCategoria = {
    ...atual.checkinsPorCategoria,
    [categoria]: (atual.checkinsPorCategoria[categoria] ?? 0) + 1,
  };
  const locaisVisitadosIds = [...atual.locaisVisitadosIds, localId];
  const locaisVisitadosUnicos = locaisVisitadosIds.length;
  return {
    locaisVisitadosUnicos,
    locaisVisitadosIds,
    checkinsPorCategoria,
    selos: computarSelos(locaisVisitadosUnicos, checkinsPorCategoria),
  };
};
