export const LIMITE_PAGINA_CONVERSAS = 30;
export const LIMITE_PAGINA_MENSAGENS = 30;
export const LIMITE_TEXTO_MENSAGEM = 1000;

/** `conversas/{uidMenor}_{uidMaior}`. Datas em ISO. */
export type Conversa = {
  id: string;
  participantes: string[];
  ultimaMensagemTexto: string;
  ultimaMensagemEm: string;
  ultimaMensagemAutorId: string;
  createdAt: string;
  updatedAt: string;
};

export type Mensagem = {
  id: string;
  conversaId: string;
  autorId: string;
  texto: string;
  storyId: string | null;
  createdAt: string;
};

export type MensagemNova = {
  conversaId: string;
  participantes: [string, string];
  autorId: string;
  texto: string;
  storyId: string | null;
};

export type PessoaConversa = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
};

/** Selo da resposta: a foto só aparece enquanto a story vive; depois some. */
export type StoryDaMensagem = {
  ativa: boolean;
  fotoUrl: string | null;
};

export type MensagemPublica = Mensagem & {
  story: StoryDaMensagem | null;
};

export type ConversaItem = {
  id: string;
  outro: PessoaConversa;
  ultimaMensagemTexto: string;
  ultimaMensagemEm: string;
  ultimaMensagemAutorId: string;
};

export type PaginaRepo<T> =
  | {ok: true; itens: T[]; proximoCursor: string | null}
  | {ok: false};
