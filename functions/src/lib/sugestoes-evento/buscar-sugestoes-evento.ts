import {log, erroDe} from "../log";
import {pontoEstaNoSul} from "../regiao-sul";
import {eventoRepository, sugestaoEventoRepository} from "../../repositories";
import {
  encerramentoValido,
  horaDoIso,
  idSugestaoEvento,
  instanteDoJsonLd,
  intervaloDoCartaz,
} from "./datas-evento";
import {
  escolherSugestoesEvento,
  type CandidatoEvento,
} from "./escolher-sugestoes-evento";
import {geocodificarConsulta, type PontoGeo} from "./geocodificar-sugestao";
import {
  buscarAgendaMotoClub,
  buscarPaginaMotoClub,
  urlEventoMotoClub,
} from "./motoclub-client";
import {parsearAgendaMotoClub, type CardAgenda} from "./parsear-agenda-motoclub";
import {parsearDetalheMotoClub, type DetalheMotoClub} from "./parsear-detalhe-motoclub";
import {pontuarSugestaoEvento} from "./pontuar-sugestao-evento";
import {salvarFotoEvento} from "./salvar-foto-evento";
import {
  acessoDaAgenda,
  montarInformacoes,
  tituloCurto,
} from "./texto-sugestao-evento";
import type {SugestaoEventoNova} from "../../types/sugestao-evento";

export const TETO_GRAVACOES = 8;
const PAUSA_GEO_MS = 1100;

export type ResultadoBuscaEventos = {
  lidas: number;
  gravadas: number;
  ignoradas: number;
};

const pausa = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const emLotes = async <T, R>(
  itens: readonly T[],
  limite: number,
  tarefa: (item: T) => Promise<R>,
): Promise<R[]> => {
  const saida: R[] = new Array(itens.length);
  let cursor = 0;
  const workers = Array.from(
    {length: Math.min(limite, itens.length)},
    async () => {
      while (cursor < itens.length) {
        const indice = cursor;
        cursor += 1;
        saida[indice] = await tarefa(itens[indice]);
      }
    },
  );
  await Promise.all(workers);
  return saida;
};

const candidatoDoCard = (
  card: CardAgenda,
  agora: Date,
): CandidatoEvento | null => {
  const quando = intervaloDoCartaz(card.dia, card.mes, card.hora || "12:00", agora);
  if (!quando) {
    return null;
  }
  const nota = pontuarSugestaoEvento({
    titulo: card.titulo,
    texto: card.texto,
    tipoLista: card.tipo,
    uf: card.uf,
  });
  if (!nota.entra) {
    return null;
  }
  return {
    id: idSugestaoEvento(card.slug, quando.inicio),
    slug: card.slug,
    titulo: tituloCurto(card.titulo),
    nota: nota.nota,
    motivos: nota.motivos,
    tipoSugerido: nota.tipoSugerido,
    inicioIso: quando.inicio,
    fimIso: quando.fim,
    cidade: card.cidade,
    uf: card.uf,
    texto: card.texto,
    fotoUrl: card.fotoUrl,
    hora: card.hora || "12:00",
  };
};

const noSul = async (consulta: string): Promise<PontoGeo | null> => {
  const ponto = await geocodificarConsulta(consulta);
  if (!ponto || !pontoEstaNoSul(ponto.lat, ponto.lng)) {
    return null;
  }
  return ponto;
};

const localizar = async (
  localNome: string,
  cidade: string,
): Promise<PontoGeo | null> => {
  const cidadeBrasil = `${cidade}, Brasil`;
  if (localNome && localNome !== cidade) {
    const preciso = await noSul(`${localNome}, ${cidadeBrasil}`);
    if (preciso) {
      return preciso;
    }
    await pausa(PAUSA_GEO_MS);
  }
  return noSul(cidadeBrasil);
};

type PaginaLida = {
  candidato: CandidatoEvento;
  detalhe: DetalheMotoClub | null;
};

type QuandoResolvido = {
  inicio: string;
  fimIso: string | null;
  limitado: boolean;
  descricao: string;
  nomeLocal: string;
  enderecoTexto: string;
  cidade: string;
  titulo: string;
};

const resolverQuando = (pagina: PaginaLida): QuandoResolvido | null => {
  const {candidato, detalhe} = pagina;
  const inicio = detalhe ?
    instanteDoJsonLd(detalhe.inicioBruto, candidato.hora) :
    candidato.inicioIso;
  if (!inicio || Date.parse(inicio) <= Date.now()) {
    return null;
  }
  const hora = horaDoIso(inicio);
  const fimBruto = detalhe?.fimBruto ?
    instanteDoJsonLd(detalhe.fimBruto, hora) :
    candidato.fimIso;
  const fim = encerramentoValido(inicio, fimBruto);
  const descricao = detalhe?.descricao || candidato.texto;
  const enderecoTexto = detalhe?.endereco || candidato.cidade;
  return {
    inicio,
    fimIso: fim.iso,
    limitado: fim.limitado,
    descricao,
    nomeLocal: (detalhe?.localNome || candidato.cidade).slice(0, 120),
    enderecoTexto,
    cidade: detalhe?.cidade && detalhe.uf ?
      `${detalhe.cidade}, ${detalhe.uf}` :
      candidato.cidade,
    titulo: tituloCurto(detalhe?.nome || candidato.titulo),
  };
};

const montar = (
  pagina: PaginaLida,
  quando: QuandoResolvido,
  ponto: PontoGeo,
  fotoCapaUrl: string,
): SugestaoEventoNova | null => {
  if (!fotoCapaUrl) {
    return null;
  }
  const {candidato} = pagina;
  const url = urlEventoMotoClub(candidato.slug);
  const acesso = acessoDaAgenda(quando.descricao, url);
  const motivos = [...candidato.motivos];
  if (quando.limitado && motivos.length < 3) {
    motivos.push("encerramento limitado a 7 dias");
  }
  const endereco = (quando.enderecoTexto || ponto.endereco).slice(0, 300);
  return {
    id: idSugestaoEvento(candidato.slug, quando.inicio),
    fonte: "motoclub",
    slug: candidato.slug,
    urlOrigem: url,
    titulo: quando.titulo,
    tipoSugerido: candidato.tipoSugerido,
    local: {
      lat: ponto.lat,
      lng: ponto.lng,
      endereco,
      nome: quando.nomeLocal,
    },
    dataHoraAbertura: quando.inicio,
    dataHoraEncerramento: quando.fimIso,
    acesso: acesso.acesso,
    linkIngresso: acesso.linkIngresso,
    informacoes: montarInformacoes(quando.descricao, url),
    fotoCapaUrl,
    nota: candidato.nota,
    motivos,
    cidade: quando.cidade,
  };
};

export const executarBuscaSugestoesEvento = async (): Promise<ResultadoBuscaEventos> => {
  const html = await buscarAgendaMotoClub();
  const cards = parsearAgendaMotoClub(html);
  const agora = new Date();
  const pontuados = cards
    .map((card) => candidatoDoCard(card, agora))
    .filter((item): item is CandidatoEvento => item !== null);

  const [ids, eventos] = await Promise.all([
    sugestaoEventoRepository.listarIds(),
    eventoRepository.listarFuturos(),
  ]);
  const escolhidos = escolherSugestoesEvento(
    pontuados,
    new Set(ids),
    eventos.map((evento) => ({
      titulo: evento.titulo,
      dataHoraAbertura: evento.dataHoraAbertura,
      linkIngresso: evento.linkIngresso,
      informacoes: evento.informacoes,
    })),
  );

  const paginas = await emLotes(escolhidos, 4, async (candidato) => {
    try {
      const pagina = await buscarPaginaMotoClub(candidato.slug);
      return {candidato, detalhe: parsearDetalheMotoClub(pagina)};
    } catch (error) {
      log.warn("SugestaoEvento", "Página do evento falhou", {
        slug: candidato.slug,
        ...erroDe(error),
      });
      return {candidato, detalhe: null};
    }
  });

  let gravadas = 0;
  for (const pagina of paginas) {
    if (gravadas >= TETO_GRAVACOES) {
      break;
    }
    try {
      const quando = resolverQuando(pagina);
      if (!quando) {
        continue;
      }
      const id = idSugestaoEvento(pagina.candidato.slug, quando.inicio);
      if (ids.includes(id)) {
        continue;
      }
      const ponto = await localizar(
        pagina.detalhe?.localNome ?? "",
        quando.cidade,
      );
      await pausa(PAUSA_GEO_MS);
      if (!ponto) {
        continue;
      }
      const foto = await salvarFotoEvento(id, pagina.candidato.fotoUrl);
      const documento = montar(pagina, quando, ponto, foto);
      if (!documento) {
        continue;
      }
      const criou = await sugestaoEventoRepository.criar(documento);
      if (criou) {
        gravadas += 1;
        ids.push(documento.id);
      }
    } catch (error) {
      log.warn("SugestaoEvento", "Candidato ignorado", {
        slug: pagina.candidato.slug,
        ...erroDe(error),
      });
    }
  }

  const resultado = {
    lidas: cards.length,
    gravadas,
    ignoradas: Math.max(0, cards.length - gravadas),
  };
  log.info("SugestaoEvento", "Rodada concluída", resultado);
  return resultado;
};
