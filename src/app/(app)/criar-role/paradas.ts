import { MAX_PARADAS } from "@/lib/mapa-viagem/viagem";
import type { Localizacao } from "@/types/role";

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
