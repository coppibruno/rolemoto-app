import type { PessoaStory } from "@/types/story-local";

export type DirecaoPessoaStory = "proxima" | "anterior";

export const filaPessoasStory = (
  eu: PessoaStory | null,
  outras: PessoaStory[],
): PessoaStory[] => [
  ...(eu && eu.contagem > 0 ? [eu] : []),
  ...outras.filter((pessoa) => pessoa.contagem > 0),
];

export const pessoaVizinha = (
  fila: PessoaStory[],
  uidAtual: string,
  direcao: DirecaoPessoaStory,
): PessoaStory | null => {
  const indice = fila.findIndex((pessoa) => pessoa.uid === uidAtual);
  if (indice < 0) return null;
  const passo = direcao === "proxima" ? 1 : -1;
  return fila[indice + passo] ?? null;
};

export const nomeBolhaStory = (pessoa: Pick<PessoaStory, "propria" | "apelido">): string =>
  pessoa.propria ? "Seu story" : pessoa.apelido;

export const rotuloBolhaStory = (
  pessoa: Pick<PessoaStory, "propria" | "apelido" | "naoVisto">,
): string => {
  if (pessoa.propria) return "Seu story";
  return pessoa.naoVisto ? `Stories de ${pessoa.apelido}` : `Rever stories de ${pessoa.apelido}`;
};
