export class PlacesNaoConfiguradoError extends Error {
  constructor() {
    super("Places não configurado");
    this.name = "PlacesNaoConfiguradoError";
  }
}

export class PlacesConsultaError extends Error {
  constructor() {
    super("Falha ao consultar o Places");
    this.name = "PlacesConsultaError";
  }
}

export class SugestaoNaoEncontradaError extends Error {
  constructor() {
    super("Sugestão não encontrada");
    this.name = "SugestaoNaoEncontradaError";
  }
}

export class SugestaoJaDecididaError extends Error {
  constructor() {
    super("Sugestão já decidida");
    this.name = "SugestaoJaDecididaError";
  }
}
