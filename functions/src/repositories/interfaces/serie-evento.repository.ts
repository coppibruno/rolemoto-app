import type {
  SerieEvento,
  SerieEventoCreate,
  StatusSerieEvento,
} from "../../types/serie-evento";

export interface SerieEventoRepository {
  criar(dados: SerieEventoCreate): Promise<SerieEvento>;
  buscarPorId(id: string): Promise<SerieEvento | null>;
  buscarPorIds(ids: string[]): Promise<SerieEvento[]>;
  listar(limite: number): Promise<SerieEvento[]>;
  listarPorStatus(status: StatusSerieEvento, limite: number): Promise<SerieEvento[]>;
  atualizar(
    id: string,
    dados: Omit<SerieEventoCreate, "criadorId">,
  ): Promise<SerieEvento | null>;
  definirStatus(id: string, status: StatusSerieEvento): Promise<SerieEvento | null>;
  definirExcecoes(id: string, excecoes: string[]): Promise<SerieEvento | null>;
}
