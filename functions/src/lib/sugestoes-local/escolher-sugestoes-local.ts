import type {CategoriaLocal, HorarioDiaLocal} from "../../types/local";
import {haversineKm} from "../geo";
import {pontoEstaNoSul} from "../regiao-sul";
import {nomesParecidos} from "./nome-parecido";
import type {FacetaBusca} from "./facetas-busca";
import {pontuarSugestaoLocal} from "./pontuar-sugestao-local";
import {TETO_GRAVACOES, type SementeLocal} from "./sementes";

export const DISTANCIA_DUPLICATA_KM = 0.15;

export type LugarCandidato = {
  placeId: string;
  nome: string;
  endereco: string;
  lat: number;
  lng: number;
  tipos: string[];
  resumo: string;
  avaliacoes: string[];
  linkMaps: string;
  aberto24h: boolean;
  horarios: HorarioDiaLocal[];
  horarioCompleto: boolean;
  fotoRecurso: string;
  fotoAtribuicao: string;
};

export type CandidatoComSemente = LugarCandidato & {
  semente: SementeLocal;
  faceta: FacetaBusca | null;
  destinoMoto?: boolean;
};

export type LocalParaDedupe = {
  googlePlaceId: string | null;
  nome: string;
  lat: number;
  lng: number;
};

export type SugestaoEscolhida = {
  id: string;
  placeId: string;
  nome: string;
  endereco: string;
  lat: number;
  lng: number;
  categoriaSugerida: CategoriaLocal;
  nota: number;
  motivos: string[];
  sementeId: string;
  sementeNome: string;
  distanciaSementeKm: number;
  linkMaps: string;
  aberto24h: boolean;
  horarios: HorarioDiaLocal[];
  horarioCompleto: boolean;
  fotoRecurso: string;
  fotoAtribuicao: string;
  fotoFachadaUrl: string;
  fotoIndisponivel: boolean;
};

const duplicaLocal = (item: SugestaoEscolhida, locais: LocalParaDedupe[]): boolean =>
  locais.some((local) => {
    if (local.googlePlaceId && local.googlePlaceId === item.placeId) {
      return true;
    }
    return (
      nomesParecidos(local.nome, item.nome) &&
      haversineKm(local.lat, local.lng, item.lat, item.lng) <= DISTANCIA_DUPLICATA_KM
    );
  });

export const escolherSugestoes = (entrada: {
  candidatos: CandidatoComSemente[];
  sugestoesIds: Set<string>;
  locais: LocalParaDedupe[];
}): SugestaoEscolhida[] => {
  const porLugar = new Map<string, SugestaoEscolhida>();

  for (const candidato of entrada.candidatos) {
    if (!candidato.placeId) {
      continue;
    }
    const distanciaKm = Math.round(
      haversineKm(
        candidato.semente.lat,
        candidato.semente.lng,
        candidato.lat,
        candidato.lng,
      ) * 10,
    ) / 10;
    const pontuacao = pontuarSugestaoLocal({
      nome: candidato.nome,
      tipos: candidato.tipos,
      resumo: candidato.resumo,
      avaliacoes: candidato.avaliacoes,
      distanciaKm,
      raioKm: candidato.semente.raioKm,
      dentroDoSul: pontoEstaNoSul(candidato.lat, candidato.lng),
      sementeNome: candidato.semente.nome,
      faceta: candidato.faceta,
      destinoMoto: candidato.destinoMoto === true,
    });
    if (!pontuacao.entra) {
      continue;
    }

    const item: SugestaoEscolhida = {
      id: candidato.placeId,
      placeId: candidato.placeId,
      nome: candidato.nome,
      endereco: candidato.endereco,
      lat: candidato.lat,
      lng: candidato.lng,
      categoriaSugerida: pontuacao.categoriaSugerida,
      nota: pontuacao.nota,
      motivos: pontuacao.motivos,
      sementeId: candidato.semente.id,
      sementeNome: candidato.semente.nome,
      distanciaSementeKm: distanciaKm,
      linkMaps: candidato.linkMaps,
      aberto24h: candidato.aberto24h,
      horarios: candidato.horarios,
      horarioCompleto: candidato.horarioCompleto,
      fotoRecurso: candidato.fotoRecurso,
      fotoAtribuicao: candidato.fotoAtribuicao,
      fotoFachadaUrl: "",
      fotoIndisponivel: false,
    };
    const atual = porLugar.get(candidato.placeId);
    if (
      !atual ||
      item.nota > atual.nota ||
      (item.nota === atual.nota && item.distanciaSementeKm < atual.distanciaSementeKm)
    ) {
      porLugar.set(candidato.placeId, item);
    }
  }

  return [...porLugar.values()]
    .filter((item) => !entrada.sugestoesIds.has(item.placeId))
    .filter((item) => !duplicaLocal(item, entrada.locais))
    .sort((a, b) => {
      if (b.nota !== a.nota) {
        return b.nota - a.nota;
      }
      return a.distanciaSementeKm - b.distanciaSementeKm;
    })
    .slice(0, TETO_GRAVACOES);
};
