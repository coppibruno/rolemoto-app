import type { Localizacao } from "@/types/role";
import type { PontoNomeado } from "./tipos";
import { distanciaKm, type Coord } from "./viagem";

export type TipoItemViagem = "saida" | "parada" | "destino" | "posto" | "cidade";

export type ItemViagem = {
  chave: string;
  tipo: TipoItemViagem;
  marca: string;
  titulo: string;
  subtitulo: string;
  distanciaKm: number | null;
};

export const LIMITE_LUGARES = 30;

const distanciaAte = (posicao: Coord | null, p: Coord): number | null =>
  posicao ? distanciaKm(posicao, p) : null;

/** Saída, paradas e destino na ordem do plano; com GPS, cada um ganha a distância. */
export const planoDaViagem = (pontos: Localizacao[], posicao: Coord | null): ItemViagem[] =>
  pontos.map((p, i) => {
    const ultimo = i === pontos.length - 1;
    const tipo: TipoItemViagem = i === 0 ? "saida" : ultimo ? "destino" : "parada";
    const nome = p.nome.trim();
    return {
      chave: `plano-${i}`,
      tipo,
      marca: tipo === "saida" ? "S" : tipo === "destino" ? "D" : String(i),
      titulo: nome || p.endereco,
      subtitulo: nome ? p.endereco : tipo === "saida" ? "Saída" : tipo === "destino" ? "Destino" : `Parada ${i}`,
      distanciaKm: distanciaAte(posicao, p),
    };
  });

/** Postos e cidades do pacote: com GPS, os mais perto primeiro. */
export const lugaresDoPacote = (
  postos: PontoNomeado[],
  cidades: PontoNomeado[],
  posicao: Coord | null,
  limite: number = LIMITE_LUGARES,
): ItemViagem[] => {
  const itens: ItemViagem[] = [
    ...cidades.map((c, i) => ({
      chave: `cidade-${i}`,
      tipo: "cidade" as const,
      marca: "",
      titulo: c.nome,
      subtitulo: "Cidade",
      distanciaKm: distanciaAte(posicao, c),
    })),
    ...postos.map((p, i) => ({
      chave: `posto-${i}`,
      tipo: "posto" as const,
      marca: "P",
      titulo: p.nome,
      subtitulo: "Posto",
      distanciaKm: distanciaAte(posicao, p),
    })),
  ];
  if (posicao) itens.sort((a, b) => (a.distanciaKm ?? 0) - (b.distanciaKm ?? 0));
  return itens.slice(0, limite);
};
