/** Trim + remove `@` inicial — mesmo critério de `/auth/resolver`. */
export const normalizarApelido = (valor: string): string =>
  valor.trim().replace(/^@+/, "");

/** E-mail “parece e-mail” se ainda tiver `@` depois de tirar o prefixo de apelido. */
export const pareceEmail = (valor: string): boolean => valor.includes("@");
