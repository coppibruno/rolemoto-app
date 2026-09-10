import { api } from "@/lib/api";
import type {
  DecisaoPiloto,
  FilaAprovacoes,
  SolicitacaoLider,
  StatusAprovacao,
} from "@/types/aprovacao";

export const aprovacoesService = {
  listar: (status: StatusAprovacao = "pendente") =>
    api<FilaAprovacoes>(`/aprovacoes?status=${status}`),

  decidir: (id: string, decisao: DecisaoPiloto) =>
    api<SolicitacaoLider>(`/aprovacoes/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ decisao }),
    }),
};
