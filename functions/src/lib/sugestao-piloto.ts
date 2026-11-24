import {normalizarBusca} from "./busca-piloto";
import type {TipoMotivoSugestao} from "../types/seguir";

export const RAIO_SUGESTAO_KM = 50;
export const LIMITE_SUGESTOES = 10;
export const DIAS_DISPENSA = 30;
export const MS_DIA = 24 * 60 * 60 * 1000;

export const NOTA_FAIXA: Record<TipoMotivoSugestao, number> = {
  segue_voce: 400,
  organizou_role: 300,
  seguido_por: 250,
  telemetria: 200,
  publicou: 150,
};

const LIMITE_ROTULO = 40;

export type PerfilDesempate = {
  pilotagem: string | null;
  tipoMoto: string | null;
  cidade: string;
};

export type RastoBruto = {
  uid: string;
  tipo: TipoMotivoSugestao;
  distanciaKm: number | null;
  titulo?: string;
  nome?: string;
  apelidoIntermediario?: string;
  /** Maior fica. No segundo grau, o vínculo mais recente comigo. */
  recencia?: number;
};

export type SugestaoOrdenada = {
  uid: string;
  tipo: TipoMotivoSugestao;
  texto: string;
};

export type PontoNome = {
  nome: string;
  lat: number;
  lng: number;
};

export type EventoResolvido = {
  localId: string | null;
  nome: string;
  lat: number;
  lng: number;
};

export type StoryParaPonto = {
  album: "local" | "evento" | "perfil";
  localId: string | null;
  eventoId: string | null;
  localizacaoNome: string | null;
  localizacaoLat: number | null;
  localizacaoLng: number | null;
};

export type FotoParaPonto = {
  marcaTipo: "local" | "evento" | null;
  marcaId: string | null;
};

export type EntradaSugestoes = {
  rastros: readonly RastoBruto[];
  perfis: ReadonlyMap<string, PerfilDesempate>;
  euUid: string;
  eu: PerfilDesempate;
  seguidos: ReadonlySet<string>;
  dispensados: ReadonlySet<string>;
  ymd: string;
  limite?: number;
};

export const idDispensa = (usuarioId: string, dispensadoId: string): string =>
  `${usuarioId}_${dispensadoId}`;

export const instanteDispensa = (agora: Date): Date =>
  new Date(agora.getTime() + DIAS_DISPENSA * MS_DIA);

export const dispensaVigente = (ate: Date, agora: Date): boolean =>
  ate.getTime() > agora.getTime();

/** Doc antigo sem o campo continua público. `false` explícito fica de fora. */
export const telemetriaEhPublica = (valor: unknown): boolean => valor !== false;

/** Hash estável, inteiro sem sinal. O mesmo texto produz o mesmo número. */
export const hashEstavel = (texto: string): number => {
  let hash = 0;
  for (let i = 0; i < texto.length; i += 1) {
    hash = Math.imul(hash, 31) + texto.charCodeAt(i);
    hash >>>= 0;
  }
  return hash;
};

/** Inteiro de −10 a +10. Não atravessa faixa. */
export const jitterDoDia = (uid: string, ymd: string): number =>
  (hashEstavel(`${uid}${ymd}`) % 21) - 10;

export const cortarRotulo = (valor: string): string => {
  const limpo = valor.trim();
  if (limpo.length <= LIMITE_ROTULO) {
    return limpo;
  }
  return `${limpo.slice(0, LIMITE_ROTULO - 1)}…`;
};

export const fraseDoRasto = (rasto: RastoBruto): string => {
  if (rasto.tipo === "segue_voce") {
    return "Segue você";
  }
  if (rasto.tipo === "seguido_por") {
    return `Seguido por ${cortarRotulo(rasto.apelidoIntermediario ?? "")}`;
  }
  if (rasto.tipo === "organizou_role") {
    return `Organizou ${cortarRotulo(rasto.titulo ?? "")} · ${rasto.distanciaKm ?? 0} km`;
  }
  // Telemetria só puxa a pessoa pro Conhecer; o texto no card não ajuda.
  if (rasto.tipo === "telemetria") {
    return "";
  }
  return `Publicou em ${cortarRotulo(rasto.nome ?? "")}`;
};

const nomeUtil = (valor: string | null | undefined): string | null => {
  const limpo = (valor ?? "").trim();
  return limpo || null;
};

const pontoLocal = (
  id: string | null,
  locais: ReadonlyMap<string, PontoNome>,
): PontoNome | null => {
  if (!id) {
    return null;
  }
  const local = locais.get(id);
  if (!local) {
    return null;
  }
  const nome = nomeUtil(local.nome);
  if (!nome) {
    return null;
  }
  return {nome, lat: local.lat, lng: local.lng};
};

const pontoEvento = (
  id: string | null,
  locais: ReadonlyMap<string, PontoNome>,
  eventos: ReadonlyMap<string, EventoResolvido>,
): PontoNome | null => {
  if (!id) {
    return null;
  }
  const evento = eventos.get(id);
  if (!evento) {
    return null;
  }
  if (evento.localId) {
    return pontoLocal(evento.localId, locais);
  }
  const nome = nomeUtil(evento.nome);
  if (!nome) {
    return null;
  }
  return {nome, lat: evento.lat, lng: evento.lng};
};

/** Sem ponto resolvível, ou com nome vazio, a story não vira candidato. */
export const pontoDaStory = (
  story: StoryParaPonto,
  locais: ReadonlyMap<string, PontoNome>,
  eventos: ReadonlyMap<string, EventoResolvido>,
): PontoNome | null => {
  if (story.album === "local") {
    return pontoLocal(story.localId, locais);
  }
  if (story.album === "evento") {
    return pontoEvento(story.eventoId, locais, eventos);
  }
  if (story.localizacaoLat === null || story.localizacaoLng === null) {
    return null;
  }
  const nome = nomeUtil(story.localizacaoNome);
  if (!nome) {
    return null;
  }
  return {
    nome,
    lat: story.localizacaoLat,
    lng: story.localizacaoLng,
  };
};

export const pontoDaFoto = (
  foto: FotoParaPonto,
  locais: ReadonlyMap<string, PontoNome>,
  eventos: ReadonlyMap<string, EventoResolvido>,
): PontoNome | null => {
  if (foto.marcaTipo === "local") {
    return pontoLocal(foto.marcaId, locais);
  }
  if (foto.marcaTipo === "evento") {
    return pontoEvento(foto.marcaId, locais, eventos);
  }
  return null;
};

export const bonusDesempate = (
  eu: PerfilDesempate,
  outro: PerfilDesempate,
): number => {
  let soma = 0;
  const pilotagemEu = (eu.pilotagem ?? "").trim();
  const pilotagemOutro = (outro.pilotagem ?? "").trim();
  if (pilotagemEu && pilotagemOutro && pilotagemEu === pilotagemOutro) {
    soma += 30;
  }
  if (eu.tipoMoto && outro.tipoMoto && eu.tipoMoto === outro.tipoMoto) {
    soma += 15;
  }
  const cidadeEu = normalizarBusca(eu.cidade);
  const cidadeOutro = normalizarBusca(outro.cidade);
  if (cidadeEu && cidadeOutro && cidadeEu === cidadeOutro) {
    soma += 10;
  }
  return soma;
};

const escolherRasto = (
  atual: RastoBruto | undefined,
  proximo: RastoBruto,
): RastoBruto => {
  if (!atual) {
    return proximo;
  }
  const diff = NOTA_FAIXA[proximo.tipo] - NOTA_FAIXA[atual.tipo];
  if (diff > 0) {
    return proximo;
  }
  if (diff < 0) {
    return atual;
  }
  if ((proximo.recencia ?? 0) > (atual.recencia ?? 0)) {
    return proximo;
  }
  return atual;
};

type Ranque = SugestaoOrdenada & {
  faixa: number;
  bonus: number;
  distanciaKm: number | null;
  jitter: number;
};

const comparar = (a: Ranque, b: Ranque): number => {
  if (a.faixa !== b.faixa) {
    return b.faixa - a.faixa;
  }
  if (a.bonus !== b.bonus) {
    return b.bonus - a.bonus;
  }
  if (
    a.distanciaKm !== null &&
    b.distanciaKm !== null &&
    a.distanciaKm !== b.distanciaKm
  ) {
    return a.distanciaKm - b.distanciaKm;
  }
  if (a.jitter !== b.jitter) {
    return b.jitter - a.jitter;
  }
  if (a.uid < b.uid) {
    return -1;
  }
  if (a.uid > b.uid) {
    return 1;
  }
  return 0;
};

/**
 * Junta os rastos, fica com a faixa mais alta e ordena sem atravessar faixa.
 * Quem não tem perfil público não entra.
 */
export const montarSugestoes = (entrada: EntradaSugestoes): SugestaoOrdenada[] => {
  const escolhidos = new Map<string, RastoBruto>();
  for (const rasto of entrada.rastros) {
    if (!rasto.uid || rasto.uid === entrada.euUid) {
      continue;
    }
    if (entrada.seguidos.has(rasto.uid) || entrada.dispensados.has(rasto.uid)) {
      continue;
    }
    if (!entrada.perfis.has(rasto.uid)) {
      continue;
    }
    escolhidos.set(rasto.uid, escolherRasto(escolhidos.get(rasto.uid), rasto));
  }

  const ranque: Ranque[] = [];
  for (const rasto of escolhidos.values()) {
    const perfil = entrada.perfis.get(rasto.uid);
    if (!perfil) {
      continue;
    }
    ranque.push({
      uid: rasto.uid,
      tipo: rasto.tipo,
      texto: fraseDoRasto(rasto),
      faixa: NOTA_FAIXA[rasto.tipo],
      bonus: bonusDesempate(entrada.eu, perfil),
      distanciaKm: rasto.distanciaKm,
      jitter: jitterDoDia(rasto.uid, entrada.ymd),
    });
  }

  ranque.sort(comparar);
  const limite = entrada.limite ?? LIMITE_SUGESTOES;
  return ranque.slice(0, limite).map((item) => ({
    uid: item.uid,
    tipo: item.tipo,
    texto: item.texto,
  }));
};
