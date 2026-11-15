/** `afiliados/{codigo}` — o id é o próprio código. Datas em ISO. */
export type Afiliado = {
  id: string;
  nome: string;
  cliques: number;
  contas: number;
  createdAt: string;
  updatedAt: string;
};
