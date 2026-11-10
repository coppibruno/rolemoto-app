export class MotoClubConsultaError extends Error {
  constructor() {
    super("Falha ao consultar o MotoClub");
    this.name = "MotoClubConsultaError";
  }
}

export class SugestaoEventoNaoEncontradaError extends Error {
  constructor() {
    super("Sugestão não encontrada");
    this.name = "SugestaoEventoNaoEncontradaError";
  }
}

export class SugestaoEventoJaDecididaError extends Error {
  constructor() {
    super("Sugestão já decidida");
    this.name = "SugestaoEventoJaDecididaError";
  }
}

export class InstagramBloqueadoError extends Error {
  constructor(
    mensagem = "Instagram sem permissão de conteúdo público",
  ) {
    super(mensagem);
    this.name = "InstagramBloqueadoError";
  }
}

export class InstagramRedeError extends Error {
  constructor() {
    super("Falha ao consultar o Instagram");
    this.name = "InstagramRedeError";
  }
}

/** A Meta recusou a troca do token. A sessão ainda pode valer até o prazo. */
export class RenovacaoTokenError extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "RenovacaoTokenError";
  }
}
