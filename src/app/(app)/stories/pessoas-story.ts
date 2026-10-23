import type { PessoaStory } from "@/types/story-local";

export const nomeBolhaStory = (pessoa: Pick<PessoaStory, "propria" | "apelido">): string =>
  pessoa.propria ? "Seu story" : pessoa.apelido;

export const rotuloBolhaStory = (
  pessoa: Pick<PessoaStory, "propria" | "apelido" | "naoVisto">,
): string => {
  if (pessoa.propria) return "Seu story";
  return pessoa.naoVisto ? `Stories de ${pessoa.apelido}` : `Rever stories de ${pessoa.apelido}`;
};
