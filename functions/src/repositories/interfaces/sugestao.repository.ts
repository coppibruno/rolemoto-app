export type RoleJanela = {
  criadorId: string;
  titulo: string;
  lat: number;
  lng: number;
  dataHoraSaida: string;
};

export type TelemetriaJanela = {
  usuarioId: string;
  nome: string;
  lat: number;
  lng: number;
  publica: boolean;
  encerradoEm: string;
};

export type StoryJanela = {
  usuarioId: string;
  album: "local" | "evento" | "perfil";
  localId: string | null;
  eventoId: string | null;
  localizacaoNome: string | null;
  localizacaoLat: number | null;
  localizacaoLng: number | null;
  createdAt: string;
};

export type FotoJanela = {
  usuarioId: string;
  marcaTipo: "local" | "evento" | null;
  marcaId: string | null;
  createdAt: string;
};

export type PontoCatalogo = {
  id: string;
  nome: string;
  lat: number;
  lng: number;
};

export type PontoEvento = {
  id: string;
  localId: string | null;
  nome: string;
  lat: number;
  lng: number;
};

/**
 * Dispensa de sugestão e as leituras com teto dos rastos públicos.
 * A nota não mora aqui.
 */
export interface SugestaoRepository {
  dispensar(usuarioId: string, dispensadoId: string): Promise<void>;
  /** No máximo 100 docs. `ate` no passado não volta. */
  listarDispensadosVigentes(usuarioId: string, agora: Date): Promise<string[]>;
  limparPorUsuario(uid: string): Promise<void>;
  /** Até 80 rolês, `dataHoraSaida` ascendente, entre `inicio` e `fim`. */
  listarRolesJanela(inicio: Date, fim: Date): Promise<RoleJanela[]>;
  /** Até 80, `encerradoEm` descendente, a partir de `desde`. */
  listarTelemetriasRecentes(desde: Date): Promise<TelemetriaJanela[]>;
  /** Até 40 stories que ainda não venceram. */
  listarStoriesVivas(agora: Date): Promise<StoryJanela[]>;
  /** Até 40 fotos a partir de `desde`. */
  listarFotosRecentes(desde: Date): Promise<FotoJanela[]>;
  /** No máximo 40 docs, ids repetidos uma vez. */
  listarLocais(ids: string[]): Promise<PontoCatalogo[]>;
  /** No máximo 40 docs, ids repetidos uma vez. */
  listarEventos(ids: string[]): Promise<PontoEvento[]>;
}
