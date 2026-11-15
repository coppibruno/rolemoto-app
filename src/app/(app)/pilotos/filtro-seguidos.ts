import type { LinhaPiloto } from "@/types/seguir";

export const termoDaBusca = (valor: string) => valor.trim().replace(/\s+/g, " ");

const normalizar = (valor: string) =>
  valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const palavrasDe = (pessoa: LinhaPiloto) =>
  normalizar(`${pessoa.apelido} ${pessoa.nome}`).split(/\s+/).filter(Boolean);

export const filtrarSeguidos = (pessoas: LinhaPiloto[], termo: string): LinhaPiloto[] => {
  const alvo = normalizar(termoDaBusca(termo));
  if (!alvo) return pessoas;
  return pessoas.filter((pessoa) => palavrasDe(pessoa).some((palavra) => palavra.startsWith(alvo)));
};
