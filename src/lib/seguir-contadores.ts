/**
 * O perfil próprio mora no AuthProvider a sessão inteira.
 * Seguir altera o número no servidor, e a tela só buscava de novo no próximo login.
 */

export type MudancaSeguir = {
  uid: string;
  delta: 1 | -1;
};

let versao = 0;
const ouvintesVersao = new Set<() => void>();
const ouvintesMudanca = new Set<(mudanca: MudancaSeguir) => void>();

export const lerVersaoSeguir = () => versao;

export const assinarVersaoSeguir = (ouvir: () => void) => {
  ouvintesVersao.add(ouvir);
  return () => {
    ouvintesVersao.delete(ouvir);
  };
};

export const assinarSeguir = (ouvir: (mudanca: MudancaSeguir) => void) => {
  ouvintesMudanca.add(ouvir);
  return () => {
    ouvintesMudanca.delete(ouvir);
  };
};

export const publicarSeguir = (mudanca: MudancaSeguir) => {
  versao += 1;
  ouvintesMudanca.forEach((ouvir) => ouvir(mudanca));
  ouvintesVersao.forEach((ouvir) => ouvir());
};
