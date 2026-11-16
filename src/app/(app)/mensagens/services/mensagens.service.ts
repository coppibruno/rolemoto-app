import { api } from "@/lib/api";
import type {
  EnvioMensagem,
  NaoLidas,
  PaginaConversas,
  PaginaMensagens,
  RespostaCurtida,
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

  naoLidas: () => api<NaoLidas>("/conversas/nao-lidas"),

  enviar: (dados: EnvioMensagem) =>
    api<RespostaEnvioMensagem>("/conversas", { method: "POST", body: JSON.stringify(dados) }),

  curtir: (conversaId: string, mensagemId: string, curtida: boolean) =>
    api<RespostaCurtida>(
      `/conversas/${encodeURIComponent(conversaId)}/mensagens/${encodeURIComponent(mensagemId)}/curtida`,
      { method: curtida ? "PUT" : "DELETE" },
    ),
};
