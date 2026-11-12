import { api } from "@/lib/api";
import type {
  BalcaoLocal,
  CupomOferta,
  OfertaLocal,
  OfertaLocalDados,
} from "@/types/oferta-local";

const base = (localId: string) => `/locais/${encodeURIComponent(localId)}`;
const daOferta = (localId: string, ofertaId: string) =>
  `${base(localId)}/ofertas/${encodeURIComponent(ofertaId)}`;

export const ofertaLocalService = {
  listar: (localId: string) => api<OfertaLocal[]>(`${base(localId)}/ofertas`),

  abrirCupom: (localId: string, ofertaId: string) =>
    api<CupomOferta>(`${daOferta(localId, ofertaId)}/cupom`, { method: "POST" }),

  balcao: (localId: string) => api<BalcaoLocal>(`${base(localId)}/balcao`),

  criar: (localId: string, dados: OfertaLocalDados) =>
    api<OfertaLocal>(`${base(localId)}/ofertas`, {
      method: "POST",
      body: JSON.stringify(dados),
    }),

  atualizar: (localId: string, ofertaId: string, dados: OfertaLocalDados & { ativa: boolean }) =>
    api<OfertaLocal>(daOferta(localId, ofertaId), {
      method: "PUT",
      body: JSON.stringify(dados),
    }),

  definirAtiva: (localId: string, ofertaId: string, ativa: boolean) =>
    api<OfertaLocal>(daOferta(localId, ofertaId), {
      method: "PATCH",
      body: JSON.stringify({ ativa }),
    }),

  apagar: (localId: string, ofertaId: string) =>
    api<void>(daOferta(localId, ofertaId), { method: "DELETE" }),

  definirDono: (localId: string, uid: string | null) =>
    api<{ donoId: string | null }>(`${base(localId)}/dono`, {
      method: "PUT",
      body: JSON.stringify({ uid }),
    }),
};
