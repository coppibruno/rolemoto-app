import {idFeedbackAlvo} from "./avaliacao-experiencia";
import type {UsuarioLocalFeedbackDoc} from "../types/avaliacao-experiencia";
import type {UsuarioLocalCheckin} from "../types/checkin-local";
import type {UsuarioLocalFavorito} from "../types/favorito-local";
import type {FacilidadeLocal, Local} from "../types/local";
import type {
  MeuLocalGaragemItem,
  MeusLocaisGaragemPayload,
} from "../types/meus-roles";

export const TETO_MEUS_LOCAIS_GARAGEM = 80;

const LABELS_FACILIDADE: Partial<Record<FacilidadeLocal, string>> = {
  patio_amplo_50: "Pátio amplo",
  calibrador_alta_pressao: "Calibrador",
  banheiros_limpos: "Banheiros",
  conveniencia_cafe: "Café",
  wifi_aberto: "Wi-Fi",
  cameras_24h: "Câmeras",
};

export const resumoFacilidades = (facilidades: FacilidadeLocal[]): string =>
  facilidades
    .slice(0, 3)
    .map((item) => LABELS_FACILIDADE[item] ?? item)
    .join(" · ");

const paraItemLocal = (
  local: Local,
  feedback: UsuarioLocalFeedbackDoc | null,
  favoritadoEm: string | null,
  visitadoEm: string | null,
): MeuLocalGaragemItem => ({
  localId: local.id,
  nome: local.nome,
  categoria: local.categoria,
  endereco: local.endereco,
  fotoFachadaUrl: local.fotoFachadaUrl,
  facilidadesResumo: resumoFacilidades(local.facilidades),
  favoritadoEm,
  visitadoEm,
  avaliado: feedback !== null,
  minhaAvaliacao: feedback ?
    {
      nota: feedback.nota,
      comentario: feedback.comentario,
      fotosCount: feedback.fotosUrls.length,
      createdAt: feedback.createdAt,
    } :
    null,
  notaMedia: local.notaMedia,
  totalAvaliacoes: local.totalAvaliacoes,
});

export const montarItensLocaisGaragem = (
  favoritos: UsuarioLocalFavorito[],
  locaisPorId: Map<string, Local>,
  feedbacksPorLocalId: Map<string, UsuarioLocalFeedbackDoc>,
): MeusLocaisGaragemPayload => {
  const itens: MeuLocalGaragemItem[] = [];

  for (const favorito of favoritos) {
    const local = locaisPorId.get(favorito.localId);
    if (!local) {
      continue;
    }
    itens.push(
      paraItemLocal(
        local,
        feedbacksPorLocalId.get(local.id) ?? null,
        favorito.createdAt,
        null,
      ),
    );
    if (itens.length >= TETO_MEUS_LOCAIS_GARAGEM) {
      break;
    }
  }

  return {itens};
};

/** Check-ins já vêm do mais recente ao mais antigo. */
export const locaisUnicosDeCheckins = (
  checkins: UsuarioLocalCheckin[],
): {localId: string; visitadoEm: string}[] => {
  const vistos = new Set<string>();
  const unicos: {localId: string; visitadoEm: string}[] = [];
  for (const checkin of checkins) {
    if (vistos.has(checkin.localId)) {
      continue;
    }
    vistos.add(checkin.localId);
    unicos.push({localId: checkin.localId, visitadoEm: checkin.createdAt});
    if (unicos.length >= TETO_MEUS_LOCAIS_GARAGEM) {
      break;
    }
  }
  return unicos;
};

export const montarItensLocaisVisitados = (
  visitas: {localId: string; visitadoEm: string}[],
  locaisPorId: Map<string, Local>,
  feedbacksPorLocalId: Map<string, UsuarioLocalFeedbackDoc>,
): MeusLocaisGaragemPayload => {
  const itens: MeuLocalGaragemItem[] = [];
  for (const visita of visitas) {
    const local = locaisPorId.get(visita.localId);
    if (!local) {
      continue;
    }
    itens.push(
      paraItemLocal(
        local,
        feedbacksPorLocalId.get(local.id) ?? null,
        null,
        visita.visitadoEm,
      ),
    );
  }
  return {itens};
};

export const idsFeedbackLocal = (
  uid: string,
  localIds: string[],
): string[] => localIds.map((id) => idFeedbackAlvo(uid, id));
