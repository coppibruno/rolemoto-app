import type { CorSelo } from "@/types/story-local";

export type { CorSelo };

export type PosicaoMarca = {
  x: number;
  y: number;
};

export type EstiloSelo = {
  background: string;
  color: string;
};

export const CORES_SELO: readonly CorSelo[] = ["neutro", "branco", "laranja", "ciano"];

export const POSICAO_MARCA_PADRAO: PosicaoMarca = { x: 50, y: 68 };

export const POSICAO_LOCAL_PADRAO: PosicaoMarca = { x: 50, y: 54 };

export const proximaCor = (atual: CorSelo): CorSelo => {
  const indice = CORES_SELO.indexOf(atual);
  return CORES_SELO[indice + 1] ?? CORES_SELO[0];
};

export const estiloSelo = (cor: CorSelo): EstiloSelo => {
  if (cor === "branco") {
    return { background: "var(--inverse-surface)", color: "var(--inverse-on-surface)" };
  }
  if (cor === "laranja") {
    return { background: "var(--primary-container)", color: "var(--on-primary-container)" };
  }
  if (cor === "ciano") {
    return { background: "var(--tertiary)", color: "var(--on-tertiary)" };
  }
  return {
    background: "color-mix(in srgb, var(--surface-container-high) 92%, transparent)",
    color: "var(--on-surface)",
  };
};

const MIN_X = 12;
const MAX_X = 88;
const MIN_Y = 20;
const MAX_Y = 76;

export const limitarPosicao = (x: number, y: number): PosicaoMarca => ({
  x: Math.round(Math.min(MAX_X, Math.max(MIN_X, x)) * 10) / 10,
  y: Math.round(Math.min(MAX_Y, Math.max(MIN_Y, y)) * 10) / 10,
});

export const estiloMarca = (
  posicao: PosicaoMarca | null,
): { left: string; top: string; transform: string } => {
  const ponto = posicao ?? POSICAO_MARCA_PADRAO;
  return {
    left: `${ponto.x}%`,
    top: `${ponto.y}%`,
    transform: "translate(-50%, -50%)",
  };
};

export const ordenarStories = <T extends { id: string; createdAt: string }>(
  stories: T[],
): T[] =>
  [...stories].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );

export const mesclarStories = <T extends { id: string; createdAt: string }>(
  lista: T[],
  inicial: T | null,
): T[] => {
  if (!inicial || lista.some((item) => item.id === inicial.id)) {
    return ordenarStories(lista);
  }
  return ordenarStories([...lista, inicial]);
};
