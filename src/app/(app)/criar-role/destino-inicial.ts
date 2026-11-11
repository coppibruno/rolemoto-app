import type { Localizacao } from "@/types/role";

const NOME_LOCAL_MAX = 60;
const ENDERECO_MIN = 3;

export type ParamsDestino = {
  destinoNome?: string | string[];
  destinoEndereco?: string | string[];
  destinoLat?: string | string[];
  destinoLng?: string | string[];
};

const texto = (valor: string | string[] | undefined): string => {
  if (typeof valor === "string") return valor.trim();
  if (Array.isArray(valor)) return (valor[0] ?? "").trim();
  return "";
};

const numero = (valor: string | string[] | undefined): number | null => {
  const bruto = texto(valor);
  if (!bruto) return null;
  const n = Number(bruto);
  return Number.isFinite(n) ? n : null;
};

export const lerDestinoInicial = (params: ParamsDestino): Localizacao | undefined => {
  const nome = texto(params.destinoNome).slice(0, NOME_LOCAL_MAX);
  const endereco = texto(params.destinoEndereco);
  const lat = numero(params.destinoLat);
  const lng = numero(params.destinoLng);
  if (!nome || endereco.length < ENDERECO_MIN || lat == null || lng == null) {
    return undefined;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return undefined;
  return { nome, endereco, lat, lng };
};

export const hrefCriarRoleComDestino = (ponto: Localizacao): string => {
  const params = new URLSearchParams({
    destinoNome: ponto.nome.trim().slice(0, NOME_LOCAL_MAX),
    destinoEndereco: ponto.endereco.trim(),
    destinoLat: String(ponto.lat),
    destinoLng: String(ponto.lng),
  });
  return `/criar-role?${params.toString()}`;
};
