export type PosicaoMarca = {
  x: number;
  y: number;
};

export const POSICAO_MARCA_PADRAO: PosicaoMarca = { x: 50, y: 68 };

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
