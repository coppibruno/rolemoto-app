import type {
  UsuarioEvento,
  UsuarioEventoCreate,
} from "../../types/usuario-evento";

/**
 * Contrato de persistência do vínculo usuário ↔ evento (`usersevento`).
 */
export interface UsuarioEventoRepository {
  buscarPorId(id: string): Promise<UsuarioEvento | null>;
  buscarPorUsuarioEEvento(
    usuarioId: string,
    eventoId: string,
  ): Promise<UsuarioEvento | null>;
  listarPorUsuario(usuarioId: string): Promise<UsuarioEvento[]>;
  listarPorEvento(eventoId: string): Promise<UsuarioEvento[]>;
  listarDestaquesDoEvento(
    eventoId: string,
    limite: number,
  ): Promise<UsuarioEvento[]>;
  contarPorEvento(eventoId: string): Promise<number>;
  contarPorEventos(ids: string[]): Promise<Map<string, number>>;
  contarPorUsuario(usuarioId: string): Promise<number>;
  criar(dados: UsuarioEventoCreate): Promise<UsuarioEvento>;
  remover(id: string): Promise<boolean>;
}
