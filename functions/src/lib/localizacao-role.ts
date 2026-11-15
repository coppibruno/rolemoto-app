import type {Localizacao} from "../types/role";

const isCoordLat = (valor: unknown): valor is number =>
  typeof valor === "number" && Number.isFinite(valor) && valor >= -90 && valor <= 90;

const isCoordLng = (valor: unknown): valor is number =>
  typeof valor === "number" &&
  Number.isFinite(valor) &&
  valor >= -180 &&
  valor <= 180;

const normalizarNome = (valor: unknown): string | null => {
  if (valor === undefined || valor === null) return "";
  if (typeof valor !== "string") return null;
  const n = valor.trim();
  if (n.length > 60) return null;
  return n;
};

export const parseLocalizacao = (valor: unknown): Localizacao | null => {
  if (!valor || typeof valor !== "object") {
    return null;
  }
  const o = valor as Localizacao;
  if (
    !isCoordLat(o.lat) ||
    !isCoordLng(o.lng) ||
    typeof o.endereco !== "string" ||
    o.endereco.trim().length < 3
  ) {
    return null;
  }
  const nome = normalizarNome(o.nome);
  if (nome === null) {
    return null;
  }
  return {
    lat: o.lat,
    lng: o.lng,
    endereco: o.endereco.trim(),
    nome,
  };
};
