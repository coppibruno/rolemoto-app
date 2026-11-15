import type { Mensagem, PessoaConversa, ReacaoStory } from "@/types/conversa";

export const REACOES_STORY: { id: ReacaoStory; emoji: string; rotulo: string }[] = [
  { id: "riso", emoji: "😂", rotulo: "Riso" },
  { id: "assustado", emoji: "😮", rotulo: "Assustado" },
  { id: "apaixonado", emoji: "😍", rotulo: "Apaixonado" },
  { id: "triste", emoji: "😢", rotulo: "Triste" },
  { id: "palmas", emoji: "👏", rotulo: "Palmas" },
  { id: "fogo", emoji: "🔥", rotulo: "Fogo" },
];

/**
 * Página mais recente (ordem cronológica) por cima do que já está na tela:
 * mantém as antigas carregadas, troca o trecho recente e não duplica id.
 */
export const juntarRecentes = (atuais: Mensagem[], recentes: Mensagem[]): Mensagem[] => {
  if (recentes.length === 0) return atuais;
  const ids = new Set(recentes.map((m) => m.id));
  const inicio = recentes[0].createdAt;
  const antigas = atuais.filter((m) => !ids.has(m.id) && m.createdAt < inicio);
  return [...antigas, ...recentes];
};

/** Mesmo id do backend: os dois uids em ordem, separados por `_`. */
export const idConversa = (a: string, b: string): string =>
  a < b ? `${a}_${b}` : `${b}_${a}`;

export const hrefConversa = (meuUid: string, outroUid: string) =>
  `/mensagens/${encodeURIComponent(idConversa(meuUid, outroUid))}`;

export const nomeNaConversa = (pessoa: PessoaConversa): string =>
  pessoa.apelido.trim() || pessoa.nome.trim().split(/\s+/)[0] || "Piloto";

const doisDigitos = (n: number) => String(n).padStart(2, "0");

/** Hoje: `HH:mm`. Outro dia: `dd/MM`. */
export const quandoMensagem = (iso: string, agora: Date = new Date()): string => {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  const mesmoDia =
    data.getFullYear() === agora.getFullYear() &&
    data.getMonth() === agora.getMonth() &&
    data.getDate() === agora.getDate();
  return mesmoDia
    ? `${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`
    : `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}`;
};
