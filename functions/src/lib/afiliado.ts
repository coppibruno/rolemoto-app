const RE_CODIGO = /^[a-z0-9-]{3,20}$/;
const NOME_MAX = 60;

export const ERRO_CODIGO = "código inválido: 3 a 20 letras minúsculas, números ou hífen";
export const ERRO_NOME = "nome inválido";
export const ERRO_CODIGO_EM_USO = "Este código já existe";

/** `null` quando não é um código possível; não consulta o banco. */
export const codigoAfiliado = (valor: unknown): string | null => {
  if (typeof valor !== "string") {
    return null;
  }
  const limpo = valor.trim();
  return RE_CODIGO.test(limpo) ? limpo : null;
};

export const nomeAfiliado = (valor: unknown): string | null => {
  if (typeof valor !== "string") {
    return null;
  }
  const limpo = valor.trim();
  return limpo.length >= 1 && limpo.length <= NOME_MAX ? limpo : null;
};
