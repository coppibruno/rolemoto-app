import type {TipoEvento} from "../../types/evento";
import {nomesParecidos} from "../sugestoes-local/nome-parecido";

export const TETO_CANDIDATOS = 16;

const JANELA_MS = 36 * 60 * 60 * 1000;

export type EventoParaDedupe = {
  titulo: string;
  dataHoraAbertura: string;
  linkIngresso: string | null;
  informacoes: string;
};

export type CandidatoEvento = {
  id: string;
  slug: string;
  titulo: string;
  nota: number;
  motivos: string[];
  tipoSugerido: TipoEvento;
  inicioIso: string;
  fimIso: string | null;
  cidade: string;
  uf: string;
  texto: string;
  fotoUrl: string;
  hora: string;
};

const urlDo = (slug: string): string => `https://motoclub.run/eventos/${slug}`;

const jaPublicado = (
  candidato: CandidatoEvento,
  evento: EventoParaDedupe,
): boolean => {
  const url = urlDo(candidato.slug);
  if (evento.linkIngresso === url || evento.informacoes.includes(url)) {
    return true;
  }
  const delta = Math.abs(
    Date.parse(evento.dataHoraAbertura) - Date.parse(candidato.inicioIso),
  );
  return delta < JANELA_MS && nomesParecidos(evento.titulo, candidato.titulo);
};

export const escolherSugestoesEvento = (
  candidatos: CandidatoEvento[],
  sugestoesIds: Set<string>,
  eventos: EventoParaDedupe[],
): CandidatoEvento[] => {
  const livres = candidatos.filter((candidato) => {
    if (sugestoesIds.has(candidato.id)) {
      return false;
    }
    return !eventos.some((evento) => jaPublicado(candidato, evento));
  });
  livres.sort((a, b) =>
    b.nota - a.nota || a.inicioIso.localeCompare(b.inicioIso),
  );
  return livres.slice(0, TETO_CANDIDATOS);
};
