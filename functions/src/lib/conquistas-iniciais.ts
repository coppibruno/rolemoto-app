import {conquistaRepository} from "../repositories";
import type {ConquistaDados} from "../types/conquista";

/** Três pontos da Serra Catarinense (SPEC 056 §3.4). Ids estáveis. */
export const CONQUISTAS_INICIAIS: (ConquistaDados & {id: string})[] = [
  {
    id: "serra-rio-do-rastro",
    nome: "Serra do Rio do Rastro",
    lat: -28.399,
    lng: -49.5478,
    raioMetros: 500,
  },
  {
    id: "serra-corvo-branco",
    nome: "Serra do Corvo Branco",
    lat: -28.0574,
    lng: -49.3667,
    raioMetros: 500,
  },
  {
    id: "morro-da-igreja",
    nome: "Morro da Igreja",
    lat: -28.1258,
    lng: -49.4808,
    raioMetros: 500,
  },
];

/**
 * Cria cada ponto só se o id não existe. Pino movido pelo admin não
 * é sobrescrito. Roda na lista do admin; o piloto não dispara seed.
 */
export const garantirConquistasIniciais = async (criadorId: string): Promise<void> => {
  for (const {id, ...dados} of CONQUISTAS_INICIAIS) {
    await conquistaRepository.criarSeAusente(id, {...dados, criadorId});
  }
};
