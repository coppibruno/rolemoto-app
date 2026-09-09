import { Timestamp } from "firebase/firestore";

export type StatusSolicitacao = "pendente" | "aceita" | "recusada";

export interface Solicitacao {
  id: string;
  roleId: string;
  userId: string;
  status: StatusSolicitacao;
  createdAt: Timestamp;
}
