export const LIMITE_PAGINA_CONVERSAS = 30;
export const LIMITE_PAGINA_MENSAGENS = 30;
export const LIMITE_TEXTO_MENSAGEM = 1000;

export const REACOES_STORY = {
  riso: "😂",
  assustado: "😮",
  apaixonado: "😍",
  triste: "😢",
  palmas: "👏",
  fogo: "🔥",
} as const;

export type ReacaoStory = keyof typeof REACOES_STORY;

/** `conversas/{uidMenor}_{uidMaior}`. Datas em ISO. */
export type Conversa = {
  id: string;
  participantes: string[];
  ultimaMensagemTexto: string;
  ultimaMensagemEm: string;
  ultimaMensagemAutorId: string;
  /** Quem ainda não abriu a última mensagem. Docs antigos sem o campo = []. */
  naoLidaPor: string[];
  createdAt: string;
  updatedAt: string;
};

export type Mensagem = {
  id: string;
  conversaId: string;
  autorId: string;
  texto: string;
  storyId: string | null;
  reacao: ReacaoStory | null;
  createdAt: string;
};

export type MensagemNova = {
  conversaId: string;
  participantes: [string, string];
  autorId: string;
  texto: string;
  storyId: string | null;
  reacao: ReacaoStory | null;
  /** Texto do resumo na lista de conversas. */
  resumo: string;
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
  naoLida: boolean;
};

export type PaginaRepo<T> =
  | {ok: true; itens: T[]; proximoCursor: string | null}
  | {ok: false};
