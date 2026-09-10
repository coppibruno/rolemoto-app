import type { Pilotagem } from "./user";
import type { RitmoRole } from "./role";
import type { UsuarioRole } from "./usuario-role";

export type StatusAprovacao = "pendente" | "aceito";

export type UsuarioResumoSolicitacao = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
  moto: string;
  pilotagem: Pilotagem;
};

export type RoleResumoSolicitacao = {
  id: string;
  titulo: string;
  ritmo: RitmoRole;
  dataHoraSaida: string;
  confirmados: number;
};

export type SolicitacaoLider = {
  id: string;
  participacao: UsuarioRole;
  usuario: UsuarioResumoSolicitacao;
  role: RoleResumoSolicitacao;
  divergenciaRitmo: boolean;
};

export type ResumoAprovacoes = {
  pendentes: number;
  aceitos: number;
  rolesComPendentes: number;
  rolesComAceitos: number;
};

export type FilaAprovacoes = {
  resumo: ResumoAprovacoes;
  itens: SolicitacaoLider[];
};

export type DecisaoPiloto = "aceitar" | "recusar";
