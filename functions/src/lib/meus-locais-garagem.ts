import {idFeedbackAlvo} from "./avaliacao-experiencia";
import type {UsuarioLocalFeedbackDoc} from "../types/avaliacao-experiencia";
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
    const feedback = feedbacksPorLocalId.get(local.id) ?? null;
    itens.push({
      localId: local.id,
      nome: local.nome,
      categoria: local.categoria,
      endereco: local.endereco,
      fotoFachadaUrl: local.fotoFachadaUrl,
      facilidadesResumo: resumoFacilidades(local.facilidades),
      favoritadoEm: favorito.createdAt,
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
    if (itens.length >= TETO_MEUS_LOCAIS_GARAGEM) {
      break;
    }
  }

  return {itens};
};

export const idsFeedbackLocal = (
  uid: string,
  localIds: string[],
): string[] => localIds.map((id) => idFeedbackAlvo(uid, id));
