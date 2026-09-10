import { api } from "@/lib/api";
import type { FeedbackPendente } from "@/types/usuario-role-feedback";

export const feedbackPendenteService = {
  buscar: () => api<FeedbackPendente>("/feedback/pendente"),
};
