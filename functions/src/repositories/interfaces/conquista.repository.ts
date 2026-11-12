import type {
  Conquista,
  ConquistaCreate,
  ConquistaUpdate,
  NovidadeConquista,
  PassagemNova,
  UsuarioConquista,
} from "../../types/conquista";

/**
 * Catálogo `conquistas` e carimbos `usersconquista` (SPEC 056).
 * A transação do par uid + conquista fica aqui.
 */
export interface ConquistaRepository {
  /** Catálogo inteiro, ativas e arquivadas. */
  listar(): Promise<Conquista[]>;
  buscarPorId(id: string): Promise<Conquista | null>;
  criar(dados: ConquistaCreate): Promise<Conquista>;
  /** Grava com o id dado só se ele não existe. `true` quando criou. */
  criarSeAusente(id: string, dados: ConquistaCreate): Promise<boolean>;
  atualizar(id: string, dados: ConquistaUpdate): Promise<Conquista | null>;

  /** Cria o carimbo, sobe o recorde ou não escreve (`null`). */
  registrarPassagem(passagem: PassagemNova): Promise<NovidadeConquista | null>;
  /** Carimbos do uid em `primeiraVezEm` crescente. */
  listarPorUsuario(usuarioId: string): Promise<UsuarioConquista[]>;
  /** Lê `{uid}_{conquistaId}` de cada uid; quem não tem carimbo não volta. */
  buscarCarimbos(
    usuarioIds: string[],
    conquistaId: string,
  ): Promise<UsuarioConquista[]>;
  limparPorUsuario(usuarioId: string): Promise<void>;
}
