import type {RitmoRole} from "./role";
import type {Pilotagem} from "./usuario";
import type {UsuarioRole} from "./usuario-role";

export type StatusAprovacao = "pendente" | "aceito";
export type DecisaoPiloto = "aceitar" | "recusar";

export type UsuarioResumoSolicitacao = {
  uid: string;
  nome: string;
  apelido: string;
  fotoUrl: string;
  moto: string;
  pilotagem: Pilotagem;
  cidade: string;
  rolesRodados: number;
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

export type FilaAprovacoes = {
  resumo: {
    pendentes: number;
    aceitos: number;
    rolesComPendentes: number;
    rolesComAceitos: number;
  };
  itens: SolicitacaoLider[];
};
