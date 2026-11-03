import {paredeSaoPauloIso} from "./sugestoes-evento/datas-evento";

const TZ = "America/Sao_Paulo";
const MS_DIA = 24 * 60 * 60 * 1000;
const YMD_AMOSTRA = "2026-01-04";

export const HORIZONTE_OCORRENCIAS = 4;
export const TETO_EXCECOES = 24;

export const ROTULOS_DIA_SEMANA = [
  "todo domingo",
  "toda segunda",
  "toda terça",
  "toda quarta",
  "toda quinta",
  "toda sexta",
  "todo sábado",
] as const;

export type OcorrenciaCalculada = {
  ymd: string;
  dataHoraAbertura: string;
  dataHoraEncerramento: string;
};

export type EntradaHorizonte = {
  diaSemana: number;
  horaAbertura: string;
  horaEncerramento: string;
  aPartirDe: string | null;
  excecoes: string[];
  agora: Date;
  horizonte?: number;
};

export type ItemSerieFeed = {
  serieId: string | null;
  cancelada: boolean;
  dataHoraAbertura: string;
  dataHoraEncerramento: string | null;
};

export type RegraSerie = {
  diaSemana: number;
  horaAbertura: string;
  horaEncerramento: string;
  aPartirDe: string | null;
};

const pad = (valor: number): string => String(valor).padStart(2, "0");

export const ymdSaoPaulo = (instante: Date): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instante);

export const partesYmd = (
  ymd: string,
): {ano: number; mes: number; dia: number} | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) {
    return null;
  }
  const ano = Number(match[1]);
  const mes = Number(match[2]);
  const dia = Number(match[3]);
  const probe = new Date(Date.UTC(ano, mes - 1, dia));
  if (
    probe.getUTCFullYear() !== ano ||
    probe.getUTCMonth() !== mes - 1 ||
    probe.getUTCDate() !== dia
  ) {
    return null;
  }
  return {ano, mes, dia};
};

export const diaSemanaDoYmd = (ymd: string): number | null => {
  const partes = partesYmd(ymd);
  if (!partes) {
    return null;
  }
  return new Date(Date.UTC(partes.ano, partes.mes - 1, partes.dia)).getUTCDay();
};

export const somarDiasYmd = (ymd: string, dias: number): string | null => {
  const partes = partesYmd(ymd);
  if (!partes) {
    return null;
  }
  const data = new Date(Date.UTC(partes.ano, partes.mes - 1, partes.dia + dias));
  return `${data.getUTCFullYear()}-${pad(data.getUTCMonth() + 1)}-${pad(data.getUTCDate())}`;
};

export const rotuloDiaSemana = (dia: number): string | null =>
  Number.isInteger(dia) && dia >= 0 && dia < ROTULOS_DIA_SEMANA.length ?
    ROTULOS_DIA_SEMANA[dia] :
    null;

export const idOcorrenciaSerie = (serieId: string, ymd: string): string =>
  `${serieId}_${ymd}`;

const parseHora = (
  valor: string,
): {hora: number; minuto: number} | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(valor.trim());
  if (!match) {
    return null;
  }
  const hora = Number(match[1]);
  const minuto = Number(match[2]);
  if (hora > 23 || minuto > 59) {
    return null;
  }
  return {hora, minuto};
};

export const normalizarHora = (valor: string): string | null => {
  const hora = parseHora(valor);
  if (!hora) {
    return null;
  }
  return `${pad(hora.hora)}:${pad(hora.minuto)}`;
};

/** Abertura e fim em ISO. `null` se o relógio for inválido ou a duração não couber em um dia. */
export const instantesOcorrencia = (
  ymd: string,
  horaAbertura: string,
  horaEncerramento: string,
): {dataHoraAbertura: string; dataHoraEncerramento: string} | null => {
  const abertura = parseHora(horaAbertura);
  const fim = parseHora(horaEncerramento);
  const partes = partesYmd(ymd);
  if (!abertura || !fim || !partes) {
    return null;
  }
  const minutosAbertura = abertura.hora * 60 + abertura.minuto;
  const minutosFim = fim.hora * 60 + fim.minuto;
  if (minutosAbertura === minutosFim) {
    return null;
  }
  const ymdFim = minutosFim < minutosAbertura ? somarDiasYmd(ymd, 1) : ymd;
  const partesFim = ymdFim ? partesYmd(ymdFim) : null;
  if (!partesFim) {
    return null;
  }
  const dataHoraAbertura = paredeSaoPauloIso(
    partes.ano,
    partes.mes,
    partes.dia,
    abertura.hora,
    abertura.minuto,
  );
  const dataHoraEncerramento = paredeSaoPauloIso(
    partesFim.ano,
    partesFim.mes,
    partesFim.dia,
    fim.hora,
    fim.minuto,
  );
  const duracao = Date.parse(dataHoraEncerramento) - Date.parse(dataHoraAbertura);
  if (duracao <= 0 || duracao >= MS_DIA) {
    return null;
  }
  return {dataHoraAbertura, dataHoraEncerramento};
};

const primeiroYmd = (
  diaSemana: number,
  piso: string,
): string | null => {
  const atual = diaSemanaDoYmd(piso);
  if (atual === null) {
    return null;
  }
  return somarDiasYmd(piso, (diaSemana - atual + 7) % 7);
};

/**
 * Até `horizonte` aberturas que ainda não encerraram.
 * Exceção e data já encerrada não consomem vaga.
 */
export const calcularHorizonte = (
  entrada: EntradaHorizonte,
): OcorrenciaCalculada[] | null => {
  if (!Number.isInteger(entrada.diaSemana) || entrada.diaSemana < 0 || entrada.diaSemana > 6) {
    return null;
  }
  if (!instantesOcorrencia(YMD_AMOSTRA, entrada.horaAbertura, entrada.horaEncerramento)) {
    return null;
  }
  const hoje = ymdSaoPaulo(entrada.agora);
  let piso = hoje;
  if (entrada.aPartirDe) {
    if (!partesYmd(entrada.aPartirDe)) {
      return null;
    }
    piso = entrada.aPartirDe > hoje ? entrada.aPartirDe : hoje;
  }
  let cursor = primeiroYmd(entrada.diaSemana, piso);
  if (!cursor) {
    return null;
  }
  const excecoes = new Set(entrada.excecoes);
  const horizonte = entrada.horizonte ?? HORIZONTE_OCORRENCIAS;
  const agoraMs = entrada.agora.getTime();
  const saida: OcorrenciaCalculada[] = [];
  let passos = 0;
  while (saida.length < horizonte && passos < 80 && cursor) {
    passos += 1;
    const ymd = cursor;
    cursor = somarDiasYmd(ymd, 7);
    if (excecoes.has(ymd)) {
      continue;
    }
    const instantes = instantesOcorrencia(
      ymd,
      entrada.horaAbertura,
      entrada.horaEncerramento,
    );
    if (!instantes) {
      return null;
    }
    if (Date.parse(instantes.dataHoraEncerramento) <= agoraMs) {
      continue;
    }
    saida.push({ymd, ...instantes});
  }
  return saida;
};

export const validarRegraSerie = (
  bruto: Record<string, unknown>,
  agora: Date,
): {ok: true; regra: RegraSerie} | {ok: false; erro: string} => {
  const dia = bruto.diaSemana;
  if (typeof dia !== "number" || !Number.isInteger(dia) || dia < 0 || dia > 6) {
    return {ok: false, erro: "diaSemana inválido"};
  }
  if (typeof bruto.horaAbertura !== "string" || typeof bruto.horaEncerramento !== "string") {
    return {ok: false, erro: "informe a abertura e o encerramento"};
  }
  const horaAbertura = normalizarHora(bruto.horaAbertura);
  const horaEncerramento = normalizarHora(bruto.horaEncerramento);
  if (!horaAbertura || !horaEncerramento) {
    return {ok: false, erro: "horário inválido"};
  }
  if (!instantesOcorrencia(YMD_AMOSTRA, horaAbertura, horaEncerramento)) {
    return {ok: false, erro: "a ocorrência precisa durar menos de 24 horas"};
  }

  let aPartirDe: string | null = null;
  const informado = bruto.aPartirDe;
  if (informado !== undefined && informado !== null && informado !== "") {
    if (typeof informado !== "string" || !partesYmd(informado)) {
      return {ok: false, erro: "aPartirDe inválida"};
    }
    if (informado < ymdSaoPaulo(agora)) {
      return {ok: false, erro: "aPartirDe não pode estar no passado"};
    }
    if (diaSemanaDoYmd(informado) !== dia) {
      return {ok: false, erro: "aPartirDe precisa cair no dia da semana"};
    }
    aPartirDe = informado;
  }

  return {ok: true, regra: {diaSemana: dia, horaAbertura, horaEncerramento, aPartirDe}};
};

export const erroYmdExcecao = (
  ymd: string,
  diaSemana: number,
  agora: Date,
): string | null => {
  if (!partesYmd(ymd)) {
    return "data inválida";
  }
  if (ymd < ymdSaoPaulo(agora)) {
    return "essa data já passou";
  }
  if (diaSemanaDoYmd(ymd) !== diaSemana) {
    return "essa data não cai no dia do encontro";
  }
  return null;
};

const estaAoVivo = (item: ItemSerieFeed, agoraMs: number): boolean => {
  const abertura = Date.parse(item.dataHoraAbertura);
  const fim = Date.parse(item.dataHoraEncerramento ?? item.dataHoraAbertura);
  return Number.isFinite(abertura) && Number.isFinite(fim) && abertura <= agoraMs && agoraMs < fim;
};

const eleger = <T extends ItemSerieFeed>(grupo: T[], agoraMs: number): T => {
  const aoVivo = grupo.filter((item) => estaAoVivo(item, agoraMs));
  const fonte = aoVivo.length > 0 ? aoVivo : grupo;
  return fonte.reduce((melhor, item) => {
    if (aoVivo.length > 0) {
      return item.dataHoraAbertura > melhor.dataHoraAbertura ? item : melhor;
    }
    return item.dataHoraAbertura < melhor.dataHoraAbertura ? item : melhor;
  });
};

/** Uma linha por série: a ao vivo, ou a abertura que ainda não encerrou mais cedo. */
export const escolherUmaPorSerie = <T extends ItemSerieFeed>(
  itens: T[],
  agora: Date,
): T[] => {
  const agoraMs = agora.getTime();
  const grupos = new Map<string, T[]>();
  for (const item of itens) {
    if (item.cancelada || !item.serieId) {
      continue;
    }
    const lista = grupos.get(item.serieId) ?? [];
    lista.push(item);
    grupos.set(item.serieId, lista);
  }
  const eleitos = new Map<string, T>();
  for (const [serieId, grupo] of grupos) {
    eleitos.set(serieId, eleger(grupo, agoraMs));
  }
  const vistos = new Set<string>();
  const saida: T[] = [];
  for (const item of itens) {
    if (item.cancelada) {
      continue;
    }
    if (!item.serieId) {
      saida.push(item);
      continue;
    }
    if (vistos.has(item.serieId)) {
      continue;
    }
    vistos.add(item.serieId);
    const eleito = eleitos.get(item.serieId);
    if (eleito) {
      saida.push(eleito);
    }
  }
  return saida;
};
