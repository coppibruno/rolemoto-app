import { api } from "@/lib/api";
import type {
  FeedbackCreate,
  FeedbackPendente,
  UsuarioRoleFeedback,
} from "@/types/usuario-role-feedback";
import type { RoleDetalhe } from "@/types/role";

export const feedbackService = {
  buscarPendente: () => api<FeedbackPendente>("/feedback/pendente"),

  buscarDetalhe: (roleId: string) => api<RoleDetalhe>(`/roles/${roleId}`),

  listar: (roleId: string) =>
    api<UsuarioRoleFeedback[]>(`/roles/${roleId}/feedbacks`),

  enviar: (roleId: string, dados: FeedbackCreate) =>
    api<UsuarioRoleFeedback>(`/roles/${roleId}/feedback`, {
      method: "POST",
      body: JSON.stringify(dados),
    }),
};
