type ComApelido = {nome: string; apelido: string};

/** Apelido para exibir a outros pilotos; vazio cai no primeiro nome. */
export const apelidoExibicao = (usuario: ComApelido | null | undefined): string => {
  const apelido = usuario?.apelido?.trim() ?? "";
  if (apelido) {
    return apelido;
  }
  const primeiroNome = usuario?.nome?.trim().split(/\s+/)[0] ?? "";
  return primeiroNome || "piloto";
};
