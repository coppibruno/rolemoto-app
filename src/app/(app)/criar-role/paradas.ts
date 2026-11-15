import { MAX_PARADAS } from "@/lib/mapa-viagem/viagem";
import { pontoEstaNoSul } from "@/lib/regiao-sul";
import type { Localizacao } from "@/types/role";
import type { LocalizacaoForm } from "./types";

const ENDERECO_PONTO_MAPA = "Ponto marcado no mapa";

/**
 * Ponto do seletor pronto para virar parada: coordenada no Sul e endereço já
 * resolvido. Enquanto o reverso do toque no mapa roda, ainda não é parada.
 */
export const paradaDoSeletor = (
  valor: LocalizacaoForm,
  resolvendoEndereco: boolean,
): Localizacao | null => {
  if (resolvendoEndereco || valor.lat == null || valor.lng == null) return null;
  if (!Number.isFinite(valor.lat) || !Number.isFinite(valor.lng)) return null;
  if (!pontoEstaNoSul(valor.lat, valor.lng)) return null;
  return {
    lat: valor.lat,
    lng: valor.lng,
    endereco: valor.endereco.trim() || ENDERECO_PONTO_MAPA,
    nome: valor.nome.trim(),
  };
};

export const incluirParada = (lista: Localizacao[], ponto: Localizacao): Localizacao[] =>
  lista.length >= MAX_PARADAS ? lista : [...lista, ponto];

/** `delta` -1 sobe, +1 desce. Fora da borda devolve a mesma lista. */
export const moverParada = (
  lista: Localizacao[],
  indice: number,
  delta: -1 | 1,
): Localizacao[] => {
  const alvo = indice + delta;
  if (indice < 0 || indice >= lista.length || alvo < 0 || alvo >= lista.length) {
    return lista;
  }
  const nova = [...lista];
  [nova[indice], nova[alvo]] = [nova[alvo], nova[indice]];
  return nova;
};

export const removerParada = (lista: Localizacao[], indice: number): Localizacao[] =>
  lista.filter((_, i) => i !== indice);
