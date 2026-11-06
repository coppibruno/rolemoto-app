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
