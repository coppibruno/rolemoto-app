export type PessoaConversa = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
};

/** Selo da resposta: a foto só vem enquanto a story vive. */
export type StoryDaMensagem = {
  ativa: boolean;
  fotoUrl: string | null;
};

export type Mensagem = {
  id: string;
  conversaId: string;
  autorId: string;
  texto: string;
  storyId: string | null;
  createdAt: string;
  story: StoryDaMensagem | null;
};

export type ConversaItem = {
  id: string;
  outro: PessoaConversa;
  ultimaMensagemTexto: string;
  ultimaMensagemEm: string;
  ultimaMensagemAutorId: string;
};

export type PaginaConversas = {
  itens: ConversaItem[];
  proximoCursor: string | null;
};

export type PaginaMensagens = {
  conversaId: string;
  outro: PessoaConversa;
  itens: Mensagem[];
  proximoCursor: string | null;
};

export type EnvioMensagem = {
  destinatarioId: string;
  texto: string;
  storyId?: string;
};

export type RespostaEnvioMensagem = {
  conversaId: string;
  mensagem: Mensagem;
};
