/** Apelido para exibir; vazio cai no primeiro nome, senão "piloto". */
export const apelidoExibicao = (nome: string, apelido: string): string => {
  const definido = apelido.trim();
  if (definido) return definido;
  const primeiro = nome.trim().split(/\s+/)[0] ?? "";
  return primeiro || "piloto";
};
