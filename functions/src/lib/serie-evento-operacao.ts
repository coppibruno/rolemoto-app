import {log} from "./log";
import {
  agendarAvisoEvento,
  agendarLembreteEvento,
  cancelarLembreteEvento,
} from "./lembretes";
import {
  calcularHorizonte,
  diaSemanaDoYmd,
  erroYmdExcecao,
  idOcorrenciaSerie,
  instantesOcorrencia,
  rotuloDiaSemana,
  TETO_EXCECOES,
  ymdSaoPaulo,
  type RegraSerie,
} from "./serie-evento";
import {validarIntervaloOcorrencia, type ConteudoEvento} from "./validar-evento";
import {
  eventoRepository,
  localRepository,
  serieEventoRepository,
  usuarioEventoFeedbackRepository,
  usuarioEventoRepository,
} from "../repositories";
import type {Evento, EventoCreate, EventoPublicacao, RecorrenciaEvento} from "../types/evento";
import type {
  OcorrenciaSerieResumo,
  SerieEvento,
  SerieEventoDetalhe,
  SerieEventoResumo,
} from "../types/serie-evento";

const USER_AVISO = "todos";
const LIMITE_LISTA = 50;
const LIMITE_CRON = 200;

export type FalhaSerie = {ok: false; status: number; erro: string};

const falha = (status: number, erro: string): FalhaSerie => ({ok: false, status, erro});

const encerrou = (evento: Evento, agora = Date.now()): boolean => {
  const fim = Date.parse(evento.dataHoraEncerramento ?? evento.dataHoraAbertura);
  return Number.isFinite(fim) && fim <= agora;
};

const paraCreate = (
  serie: SerieEvento,
  ymd: string,
  instantes: {dataHoraAbertura: string; dataHoraEncerramento: string},
): EventoCreate => ({
  titulo: serie.titulo,
  tipo: serie.tipo,
  local: serie.local,
  localId: serie.localId,
  dataHoraAbertura: instantes.dataHoraAbertura,
  dataHoraEncerramento: instantes.dataHoraEncerramento,
  acesso: serie.acesso,
  linkIngresso: serie.linkIngresso,
  atracoes: serie.atracoes,
  fotoCapaUrl: serie.fotoCapaUrl,
  informacoes: serie.informacoes,
  criadorId: serie.criadorId,
  serieId: serie.id,
  ocorrenciaYmd: ymd,
  ocorrenciaAjustada: false,
  cancelada: false,
});

const publicacaoDaSerie = (
  serie: SerieEvento,
  evento: Evento,
  instantes: {dataHoraAbertura: string; dataHoraEncerramento: string},
): EventoPublicacao => ({
  titulo: serie.titulo,
  tipo: serie.tipo,
  local: serie.local,
  localId: serie.localId,
  dataHoraAbertura: instantes.dataHoraAbertura,
  dataHoraEncerramento: instantes.dataHoraEncerramento,
  acesso: serie.acesso,
  linkIngresso: serie.linkIngresso,
  atracoes: serie.atracoes,
  fotoCapaUrl: serie.fotoCapaUrl,
  informacoes: serie.informacoes,
  serieId: serie.id,
  ocorrenciaYmd: evento.ocorrenciaYmd,
  ocorrenciaAjustada: false,
  cancelada: false,
});

const agendarNova = async (evento: Evento): Promise<void> => {
  await agendarAvisoEvento(
    {eventoId: evento.id, titulo: evento.titulo},
    evento.dataHoraAbertura,
  );
  await agendarLembreteEvento(
    {eventoId: evento.id, userId: evento.criadorId, titulo: evento.titulo},
    evento.dataHoraAbertura,
  );
};

const uidsLembrete = async (evento: Evento): Promise<string[]> => {
  const vinculos = await usuarioEventoRepository.listarPorEvento(evento.id);
  return [...new Set(
    [evento.criadorId, ...vinculos.map((vinculo) => vinculo.usuarioId)].filter(Boolean),
  )];
};

const cancelarAvisoECriador = async (evento: Evento): Promise<void> => {
  await cancelarLembreteEvento(evento.id, USER_AVISO, evento.dataHoraAbertura);
  if (evento.criadorId) {
    await cancelarLembreteEvento(evento.id, evento.criadorId, evento.dataHoraAbertura);
  }
};

const cancelarTodas = async (evento: Evento): Promise<void> => {
  const uids = await uidsLembrete(evento);
  await cancelarLembreteEvento(evento.id, USER_AVISO, evento.dataHoraAbertura);
  await Promise.all(
    uids.map((uid) => cancelarLembreteEvento(evento.id, uid, evento.dataHoraAbertura)),
  );
};

const agendarTodas = async (evento: Evento): Promise<void> => {
  const uids = await uidsLembrete(evento);
  await agendarAvisoEvento(
    {eventoId: evento.id, titulo: evento.titulo},
    evento.dataHoraAbertura,
  );
  await Promise.all(
    uids.map((uid) =>
      agendarLembreteEvento(
        {eventoId: evento.id, userId: uid, titulo: evento.titulo},
        evento.dataHoraAbertura,
      ),
    ),
  );
};

export const materializarFaltantes = async (serie: SerieEvento): Promise<Evento[]> => {
  const horizonte = calcularHorizonte({
    diaSemana: serie.diaSemana,
    horaAbertura: serie.horaAbertura,
    horaEncerramento: serie.horaEncerramento,
    aPartirDe: serie.aPartirDe,
    excecoes: serie.excecoes,
    agora: new Date(),
  });
  if (!horizonte) {
    return [];
  }
  const criadas: Evento[] = [];
  for (const data of horizonte) {
    const resultado = await eventoRepository.gravarSeAusente(
      idOcorrenciaSerie(serie.id, data.ymd),
      paraCreate(serie, data.ymd, data),
    );
    if (!resultado.criado) {
      continue;
    }
    await agendarNova(resultado.evento);
    criadas.push(resultado.evento);
  }
  return criadas;
};

const ehLivre = async (evento: Evento): Promise<boolean> => {
  if (evento.cancelada || evento.ocorrenciaAjustada || encerrou(evento)) {
    return false;
  }
  const [inscritos, avaliacoes] = await Promise.all([
    usuarioEventoRepository.contarPorEvento(evento.id),
    usuarioEventoFeedbackRepository.listarPorEvento(evento.id, 1),
  ]);
  return inscritos === 0 && avaliacoes.length === 0;
};

const incluirExcecao = (excecoes: string[], ymd: string | null): string[] => {
  if (!ymd || excecoes.includes(ymd) || excecoes.length >= TETO_EXCECOES) {
    return excecoes;
  }
  return [...excecoes, ymd];
};

const aplicarPulo = async (evento: Evento, excecoes: string[]): Promise<string[]> => {
  const proximas = incluirExcecao(excecoes, evento.ocorrenciaYmd);
  if (await ehLivre(evento)) {
    await cancelarAvisoECriador(evento);
    await eventoRepository.remover(evento.id);
    return proximas;
  }
  await cancelarTodas(evento);
  if (!evento.cancelada) {
    await eventoRepository.marcarCancelada(evento.id);
  }
  return proximas;
};

const resumirOcorrencias = async (
  serie: SerieEvento,
): Promise<OcorrenciaSerieResumo[]> => {
  const hoje = ymdSaoPaulo(new Date());
  const docs = await eventoRepository.listarPorSerie(serie.id);
  const visiveis = docs.filter((evento) => {
    const ymd = evento.ocorrenciaYmd ?? "";
    const fim = Date.parse(evento.dataHoraEncerramento ?? evento.dataHoraAbertura);
    return ymd >= hoje || (Number.isFinite(fim) && fim > Date.now());
  }).slice(0, 8);
  const contagens = await usuarioEventoRepository.contarPorEventos(
    visiveis.map((evento) => evento.id),
  );
  return visiveis.map((evento) => ({
    id: evento.id,
    ocorrenciaYmd: evento.ocorrenciaYmd,
    dataHoraAbertura: evento.dataHoraAbertura,
    dataHoraEncerramento: evento.dataHoraEncerramento,
    cancelada: evento.cancelada,
    ocorrenciaAjustada: evento.ocorrenciaAjustada,
    inscritos: contagens.get(evento.id) ?? 0,
  }));
};

export const detalheSerie = async (serie: SerieEvento): Promise<SerieEventoDetalhe> => ({
  serie,
  ocorrencias: await resumirOcorrencias(serie),
});

const proximaDe = (ocorrencias: Evento[]): SerieEventoResumo["proxima"] => {
  const agora = Date.now();
  const viva = ocorrencias
    .filter((evento) => !evento.cancelada && !encerrou(evento, agora))
    .sort((a, b) => a.dataHoraAbertura.localeCompare(b.dataHoraAbertura))[0];
  if (!viva) {
    return null;
  }
  return {
    id: viva.id,
    dataHoraAbertura: viva.dataHoraAbertura,
    dataHoraEncerramento: viva.dataHoraEncerramento,
  };
};

export const listarResumos = async (): Promise<SerieEventoResumo[]> => {
  const series = await serieEventoRepository.listar(LIMITE_LISTA);
  const resumos: SerieEventoResumo[] = [];
  for (const serie of series) {
    const ocorrencias = await eventoRepository.listarPorSerie(serie.id);
    resumos.push({
      id: serie.id,
      titulo: serie.titulo,
      status: serie.status,
      diaSemana: serie.diaSemana,
      rotulo: rotuloDiaSemana(serie.diaSemana) ?? "",
      horaAbertura: serie.horaAbertura,
      horaEncerramento: serie.horaEncerramento,
      localId: serie.localId,
      proxima: proximaDe(ocorrencias),
    });
  }
  return resumos;
};

const resolverLocal = async (
  body: unknown,
): Promise<{ok: true; localId: string | null} | FalhaSerie> => {
  if (!body || typeof body !== "object") {
    return {ok: true, localId: null};
  }
  const valor = (body as Record<string, unknown>).localId;
  if (valor === undefined || valor === null || valor === "") {
    return {ok: true, localId: null};
  }
  if (typeof valor !== "string") {
    return falha(400, "local não encontrado");
  }
  const local = await localRepository.buscarPorId(valor.trim());
  if (!local) {
    return falha(400, "local não encontrado");
  }
  return {ok: true, localId: local.id};
};

const exigirSerie = async (
  id: string,
): Promise<{ok: true; serie: SerieEvento} | FalhaSerie> => {
  const serie = await serieEventoRepository.buscarPorId(id);
  if (!serie) {
    return falha(404, "Encontro não encontrado");
  }
  return {ok: true, serie};
};

export const criarSerie = async (
  conteudo: ConteudoEvento,
  regra: RegraSerie,
  body: unknown,
  criadorId: string,
) => {
  const localId = await resolverLocal(body);
  if (!localId.ok) {
    return localId;
  }
  const serie = await serieEventoRepository.criar({
    ...conteudo,
    ...regra,
    localId: localId.localId,
    criadorId,
  });
  const ocorrencias = await materializarFaltantes(serie);
  log.info("SerieEvento", "Série criada", {
    serieId: serie.id,
    criadas: ocorrencias.length,
  });
  return {ok: true as const, dados: {serie, ocorrencias}};
};

export const obterSerie = async (id: string) => {
  const achada = await exigirSerie(id);
  if (!achada.ok) {
    return achada;
  }
  return {ok: true as const, dados: await detalheSerie(achada.serie)};
};

export const atualizarSerie = async (
  id: string,
  conteudo: ConteudoEvento,
  regra: RegraSerie,
  body: unknown,
) => {
  const achada = await exigirSerie(id);
  if (!achada.ok) {
    return achada;
  }
  if (achada.serie.status === "encerrada") {
    return falha(409, "encontro encerrado");
  }
  const localId = await resolverLocal(body);
  if (!localId.ok) {
    return localId;
  }
  const salva = await serieEventoRepository.atualizar(id, {
    ...conteudo,
    ...regra,
    localId: localId.localId,
  });
  if (!salva) {
    return falha(404, "Encontro não encontrado");
  }
  const diaMudou = achada.serie.diaSemana !== regra.diaSemana;
  const ocorrencias = await eventoRepository.listarPorSerie(id);
  for (const ocorrencia of ocorrencias) {
    if (!(await ehLivre(ocorrencia))) {
      continue;
    }
    const ymd = ocorrencia.ocorrenciaYmd;
    const dia = ymd ? diaSemanaDoYmd(ymd) : null;
    if (diaMudou && dia !== null && dia !== regra.diaSemana) {
      await cancelarAvisoECriador(ocorrencia);
      await eventoRepository.remover(ocorrencia.id);
      continue;
    }
    if (!ymd) {
      continue;
    }
    const instantes = instantesOcorrencia(
      ymd,
      regra.horaAbertura,
      regra.horaEncerramento,
    );
    if (!instantes) {
      continue;
    }
    const aberturaMudou =
      Date.parse(instantes.dataHoraAbertura) !== Date.parse(ocorrencia.dataHoraAbertura);
    if (aberturaMudou) {
      await cancelarAvisoECriador(ocorrencia);
    }
    await eventoRepository.atualizarOcorrencia(
      ocorrencia.id,
      publicacaoDaSerie(salva, ocorrencia, instantes),
    );
    if (aberturaMudou) {
      const atualizado = await eventoRepository.buscarPorId(ocorrencia.id);
      if (atualizado) {
        await agendarNova(atualizado);
      }
    }
  }
  await materializarFaltantes(salva);
  return {ok: true as const, dados: await detalheSerie(salva)};
};

export const pausarSerie = async (id: string) => {
  const achada = await exigirSerie(id);
  if (!achada.ok) {
    return achada;
  }
  if (achada.serie.status === "encerrada") {
    return falha(409, "encontro encerrado");
  }
  const salva = await serieEventoRepository.definirStatus(id, "pausada");
  if (!salva) {
    return falha(404, "Encontro não encontrado");
  }
  return {ok: true as const, dados: await detalheSerie(salva)};
};

export const retomarSerie = async (id: string) => {
  const achada = await exigirSerie(id);
  if (!achada.ok) {
    return achada;
  }
  if (achada.serie.status === "encerrada") {
    return falha(409, "encontro encerrado");
  }
  const salva = await serieEventoRepository.definirStatus(id, "ativa");
  if (!salva) {
    return falha(404, "Encontro não encontrado");
  }
  await materializarFaltantes(salva);
  return {ok: true as const, dados: await detalheSerie(salva)};
};

export const encerrarSerie = async (id: string) => {
  const achada = await exigirSerie(id);
  if (!achada.ok) {
    return achada;
  }
  if (achada.serie.status === "encerrada") {
    return falha(409, "encontro encerrado");
  }
  const ocorrencias = await eventoRepository.listarPorSerie(id);
  let excecoes = [...achada.serie.excecoes];
  for (const ocorrencia of ocorrencias) {
    if (encerrou(ocorrencia)) {
      continue;
    }
    excecoes = await aplicarPulo(ocorrencia, excecoes);
  }
  await serieEventoRepository.definirExcecoes(id, excecoes);
  const salva = await serieEventoRepository.definirStatus(id, "encerrada");
  if (!salva) {
    return falha(404, "Encontro não encontrado");
  }
  return {ok: true as const, dados: await detalheSerie(salva)};
};

export const pularData = async (id: string, ymd: unknown) => {
  const achada = await exigirSerie(id);
  if (!achada.ok) {
    return achada;
  }
  if (achada.serie.status === "encerrada") {
    return falha(409, "encontro encerrado");
  }
  if (typeof ymd !== "string") {
    return falha(400, "data inválida");
  }
  if (achada.serie.excecoes.includes(ymd)) {
    return {ok: true as const, dados: achada.serie};
  }
  const erroData = erroYmdExcecao(ymd, achada.serie.diaSemana, new Date());
  if (erroData) {
    return falha(400, erroData);
  }
  if (achada.serie.excecoes.length >= TETO_EXCECOES) {
    return falha(400, "limite de 24 datas puladas");
  }
  const ocorrencia = await eventoRepository.buscarPorId(
    idOcorrenciaSerie(achada.serie.id, ymd),
  );
  if (ocorrencia && encerrou(ocorrencia)) {
    return falha(409, "essa data já passou");
  }
  const excecoes = ocorrencia ?
    await aplicarPulo(ocorrencia, achada.serie.excecoes) :
    incluirExcecao(achada.serie.excecoes, ymd);
  const salva = await serieEventoRepository.definirExcecoes(id, excecoes);
  if (!salva) {
    return falha(404, "Encontro não encontrado");
  }
  return {ok: true as const, dados: salva};
};

const textoCurto = (
  valor: unknown,
  min: number,
  max: number,
  erro: string,
): {ok: true; texto: string} | FalhaSerie => {
  if (typeof valor !== "string") {
    return falha(400, erro);
  }
  const texto = valor.trim();
  if (texto.length < min || texto.length > max) {
    return falha(400, erro);
  }
  return {ok: true, texto};
};

export const ajustarOcorrencia = async (id: string, body: unknown) => {
  if (!body || typeof body !== "object") {
    return falha(400, "informe o ajuste");
  }
  const bruto = body as Record<string, unknown>;
  const evento = await eventoRepository.buscarPorId(id);
  if (!evento) {
    return falha(404, "Evento não encontrado");
  }
  if (!evento.serieId) {
    return falha(400, "só dá para ajustar uma data de encontro semanal");
  }
  if (evento.cancelada) {
    return falha(409, "esta data foi cancelada");
  }
  if (encerrou(evento)) {
    return falha(409, "essa data já passou");
  }

  let titulo = evento.titulo;
  if ("titulo" in bruto) {
    const lido = textoCurto(bruto.titulo, 3, 80, "titulo é obrigatório");
    if (!lido.ok) {
      return lido;
    }
    titulo = lido.texto;
  }
  let informacoes = evento.informacoes;
  if ("informacoes" in bruto) {
    const lido = textoCurto(bruto.informacoes, 0, 2000, "informacoes inválida");
    if (!lido.ok) {
      return lido;
    }
    informacoes = lido.texto;
  }

  const temIso = "dataHoraAbertura" in bruto || "dataHoraEncerramento" in bruto;
  const temRelogio = "horaAbertura" in bruto || "horaEncerramento" in bruto;
  if (temIso && temRelogio) {
    return falha(400, "envie o horário num formato só");
  }

  let abertura = evento.dataHoraAbertura;
  let fim = evento.dataHoraEncerramento;
  if (temIso) {
    if (
      typeof bruto.dataHoraAbertura !== "string" ||
      typeof bruto.dataHoraEncerramento !== "string"
    ) {
      return falha(400, "informe a abertura e o encerramento");
    }
    const intervalo = validarIntervaloOcorrencia(
      bruto.dataHoraAbertura,
      bruto.dataHoraEncerramento,
    );
    if (!intervalo.ok) {
      return falha(400, intervalo.erro);
    }
    abertura = bruto.dataHoraAbertura;
    fim = bruto.dataHoraEncerramento;
  }
  if (temRelogio) {
    if (typeof bruto.horaAbertura !== "string" || typeof bruto.horaEncerramento !== "string") {
      return falha(400, "informe a abertura e o encerramento");
    }
    if (!evento.ocorrenciaYmd) {
      return falha(400, "ocorrência sem data");
    }
    const instantes = instantesOcorrencia(
      evento.ocorrenciaYmd,
      bruto.horaAbertura,
      bruto.horaEncerramento,
    );
    if (!instantes) {
      return falha(400, "a ocorrência precisa durar menos de 24 horas");
    }
    abertura = instantes.dataHoraAbertura;
    fim = instantes.dataHoraEncerramento;
  }
  if (!fim) {
    return falha(400, "informe o encerramento");
  }

  const aberturaMudou = Date.parse(abertura) !== Date.parse(evento.dataHoraAbertura);
  if (aberturaMudou) {
    await cancelarTodas(evento);
  }
  const atualizado = await eventoRepository.atualizarOcorrencia(evento.id, {
    titulo,
    tipo: evento.tipo,
    local: evento.local,
    localId: evento.localId,
    dataHoraAbertura: abertura,
    dataHoraEncerramento: fim,
    acesso: evento.acesso,
    linkIngresso: evento.linkIngresso,
    atracoes: evento.atracoes,
    fotoCapaUrl: evento.fotoCapaUrl,
    informacoes,
    serieId: evento.serieId,
    ocorrenciaYmd: evento.ocorrenciaYmd,
    ocorrenciaAjustada: true,
    cancelada: false,
  });
  if (!atualizado) {
    return falha(404, "Evento não encontrado");
  }
  if (aberturaMudou) {
    await agendarTodas(atualizado);
  }
  return {ok: true as const, dados: atualizado};
};

export const gerarHorizonteAtivas = async (): Promise<{series: number; criadas: number}> => {
  const ativas = await serieEventoRepository.listarPorStatus("ativa", LIMITE_CRON);
  let criadas = 0;
  for (const serie of ativas) {
    const novas = await materializarFaltantes(serie);
    criadas += novas.length;
  }
  log.info("SerieEvento", "Horizonte gerado", {series: ativas.length, criadas});
  return {series: ativas.length, criadas};
};

export const anexarRecorrencia = async <T extends {serieId: string | null}>(
  itens: T[],
): Promise<Array<T & {recorrencia: RecorrenciaEvento | null}>> => {
  const ids = [...new Set(
    itens.map((item) => item.serieId).filter((id): id is string => Boolean(id)),
  )];
  const series = await serieEventoRepository.buscarPorIds(ids);
  const porId = new Map(series.map((serie) => [serie.id, serie]));
  return itens.map((item) => {
    const serie = item.serieId ? porId.get(item.serieId) : undefined;
    const rotulo = serie ? rotuloDiaSemana(serie.diaSemana) : null;
    const recorrencia = serie && rotulo ?
      {serieId: serie.id, diaSemana: serie.diaSemana, rotulo} :
      null;
    return {...item, recorrencia};
  });
};

export const bodyTemAjuste = (body: unknown): boolean => {
  if (!body || typeof body !== "object") {
    return false;
  }
  const bruto = body as Record<string, unknown>;
  return (
    "titulo" in bruto ||
    "informacoes" in bruto ||
    "dataHoraAbertura" in bruto ||
    "dataHoraEncerramento" in bruto ||
    "horaAbertura" in bruto ||
    "horaEncerramento" in bruto
  );
};
