import type { PessoaConversa } from "@/types/conversa";

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
