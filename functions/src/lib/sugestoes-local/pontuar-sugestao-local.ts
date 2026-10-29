import type {CategoriaLocal} from "../../types/local";
import {rotuloFaceta, type FacetaBusca} from "./facetas-busca";

export const NOTA_MINIMA = 50;
const PERTO_KM = 5;

const TERMOS_FORTES = [
  "moto point",
  "motopoint",
  "point de moto",
  "oficina de motos",
  "oficina de moto",
  "mirante",
  "serra",
] as const;

const TERMOS_ESTRADA = [
  "motociclista",
  "motoqueiro",
  "comboio",
  "custom",
  "trail",
  "harley",
  "estrada",
  "curva",
  "moto",
] as const;

const TERMOS_CIDADE = [
  "shopping",
  "supermercado",
  "escola",
  "hospital",
  "aeroporto",
  "hotel",
  "pousada",
] as const;

const TIPOS_CIDADE = [
  "shopping_mall",
  "supermarket",
  "grocery_store",
  "school",
  "university",
  "hospital",
  "airport",
  "lodging",
  "hotel",
] as const;

const TIPOS_COMPATIVEIS = [
  "tourist_attraction",
  "viewpoint",
  "park",
  "cafe",
  "restaurant",
  "bar",
  "motorcycle_dealer",
] as const;

export type EntradaPontuacao = {
  nome: string;
  tipos: string[];
  resumo: string;
  avaliacoes: string[];
  distanciaKm: number;
  raioKm: number;
  dentroDoSul: boolean;
  sementeNome: string;
  faceta?: FacetaBusca | null;
};

export type PontuacaoAceita = {
  entra: true;
  nota: number;
  categoriaSugerida: CategoriaLocal;
  motivos: string[];
};

export type PontuacaoRecusada = {entra: false};

const normalizar = (valor: string): string =>
  valor
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

const escapar = (valor: string): string => valor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const contemTermo = (texto: string, termo: string): boolean => {
  const base = normalizar(texto);
  const alvo = normalizar(termo);
  if (!alvo) {
    return false;
  }
  const re = new RegExp(`(^|[^a-z0-9])${escapar(alvo)}([^a-z0-9]|$)`);
  return re.test(base);
};

const termoForte = (nome: string): string | null => {
  for (const termo of TERMOS_FORTES) {
    if (contemTermo(nome, termo)) {
      return termo;
    }
  }
  return null;
};

const temCidade = (nome: string, tipos: string[]): boolean => {
  if (TERMOS_CIDADE.some((termo) => contemTermo(nome, termo))) {
    return true;
  }
  return tipos.some((tipo) => (TIPOS_CIDADE as readonly string[]).includes(tipo));
};

const termoEstrada = (
  resumo: string,
  avaliacoes: string[],
): string | null => {
  for (const termo of TERMOS_ESTRADA) {
    if (contemTermo(resumo, termo)) {
      return `resumo cita ${termo}`;
    }
  }
  const texto = avaliacoes.join(" ");
  for (const termo of TERMOS_ESTRADA) {
    if (contemTermo(texto, termo)) {
      return `avaliação cita ${termo}`;
    }
  }
  return null;
};

const sugerirCategoria = (nome: string, faceta: FacetaBusca | null): CategoriaLocal => {
  if (faceta === "restaurante" || faceta === "padaria" || faceta === "cafe") {
    return "restaurante_estrada";
  }
  if (faceta === "natureza") {
    return "mirante";
  }
  if (["mirante", "vista", "canyon", "serra"].some((termo) => contemTermo(nome, termo))) {
    return "mirante";
  }
  if (
    ["moto point", "motopoint", "point", "encontro"].some((termo) => contemTermo(nome, termo))
  ) {
    return "bar_moto_point";
  }
  if (["oficina", "mecanica de moto"].some((termo) => contemTermo(nome, termo))) {
    return "oficina";
  }
  if (["restaurante", "cafe", "lanchonete"].some((termo) => contemTermo(nome, termo))) {
    return "restaurante_estrada";
  }
  if (contemTermo(nome, "posto")) {
    return "posto";
  }
  return "bar_moto_point";
};

const distanciaTexto = (km: number): string => km.toFixed(1).replace(".", ",");

export const pontuarSugestaoLocal = (
  entrada: EntradaPontuacao,
): PontuacaoAceita | PontuacaoRecusada => {
  if (!entrada.dentroDoSul || entrada.distanciaKm > entrada.raioKm) {
    return {entra: false};
  }
  if (temCidade(entrada.nome, entrada.tipos)) {
    return {entra: false};
  }

  const forte = termoForte(entrada.nome);
  if (entrada.tipos.includes("gas_station") && !forte) {
    return {entra: false};
  }

  let nota = 0;
  const motivos: string[] = [];
  const faceta = entrada.faceta ?? null;
  if (forte) {
    nota += 50;
    motivos.push(`nome tem ${forte}`);
  } else if (faceta) {
    nota += 50;
    motivos.push(`busca de ${rotuloFaceta(faceta)}`);
  }
  const estrada = termoEstrada(entrada.resumo, entrada.avaliacoes);
  if (estrada) {
    nota += 30;
    motivos.push(estrada);
  }
  if (entrada.tipos.some((tipo) => (TIPOS_COMPATIVEIS as readonly string[]).includes(tipo))) {
    nota += 15;
  }
  if (entrada.distanciaKm <= PERTO_KM) {
    nota += 10;
  }
  if (nota < NOTA_MINIMA) {
    return {entra: false};
  }

  motivos.push(`${distanciaTexto(entrada.distanciaKm)} km da ${entrada.sementeNome}`);
  return {
    entra: true,
    nota,
    categoriaSugerida: sugerirCategoria(entrada.nome, faceta),
    motivos: motivos.slice(0, 3),
  };
};
