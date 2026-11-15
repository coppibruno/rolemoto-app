import { api } from "@/lib/api";
import type {
  EnvioMensagem,
  PaginaConversas,
  PaginaMensagens,
  RespostaEnvioMensagem,
} from "@/types/conversa";

const comCursor = (base: string, cursor: string | null) =>
  cursor ? `${base}?cursor=${encodeURIComponent(cursor)}` : base;

export const mensagensService = {
  listarConversas: (cursor: string | null = null) =>
    api<PaginaConversas>(comCursor("/conversas", cursor)),

  listarMensagens: (conversaId: string, cursor: string | null = null) =>
    api<PaginaMensagens>(
      comCursor(`/conversas/${encodeURIComponent(conversaId)}/mensagens`, cursor),
    ),

  enviar: (dados: EnvioMensagem) =>
    api<RespostaEnvioMensagem>("/conversas", { method: "POST", body: JSON.stringify(dados) }),
};
