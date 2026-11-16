import {apelidoExibicao} from "./apelido";
import {agruparCompactos, ehCompacto, resumirTracado} from "./atividade";
import {eventoEncerrouParaAvaliacao} from "./avaliacao-experiencia";
import {erroDe, log} from "./log";
import {
  atividadeRepository,
  eventoRepository,
  localRepository,
  postFotoRepository,
  roleRepository,
  roleTelemetriaRepository,
  usuarioEventoFeedbackRepository,
  usuarioEventoRepository,
  usuarioLocalFeedbackRepository,
  usuarioRepository,
  usuarioRoleRepository,
} from "../repositories";
import type {
  AlvoAtividade,
  AlvoRoleAtividade,
  Atividade,
  ItemAtividade,
  MinhaParticipacaoRole,
} from "../types/atividade";
import type {
  UsuarioEventoFeedbackDoc,
  UsuarioLocalFeedbackDoc,
} from "../types/avaliacao-experiencia";
import type {Evento} from "../types/evento";
import type {Local} from "../types/local";
import type {AutorPost, ComentarioPublico, PostFoto} from "../types/post-foto";
import type {Role} from "../types/role";
import type {RoleTelemetria} from "../types/role-telemetria";
import type {Usuario} from "../types/usuario";
import type {UsuarioRole} from "../types/usuario-role";

const MAX_PARTICIPANTES_CARD = 5;
const MAX_AUTORES_EXIBIDOS = 3;

type Contexto = {
  tokenUid: string;
  usuarios: Map<string, Usuario>;
  posts: Map<string, PostFoto>;
  telemetrias: Map<string, RoleTelemetria>;
  roles: Map<string, Role>;
  confirmados: Map<string, number>;
  minhasParticipacoes: Map<string, UsuarioRole | null>;
  participantes: Map<string, string[]>;
  eventos: Map<string, Evento>;
  inscritos: Set<string>;
  locais: Map<string, Local>;
  avaliacoesLocal: Map<string, UsuarioLocalFeedbackDoc>;
  avaliacoesEvento: Map<string, UsuarioEventoFeedbackDoc>;
  curtidas: Set<string>;
};

const porId = <T extends {id: string}>(itens: T[]): Map<string, T> =>
  new Map(itens.map((item) => [item.id, item]));

const unicos = (valores: string[]): string[] => [...new Set(valores.filter(Boolean))];

const idsDo = (atividades: Atividade[], alvoTipo: Atividade["alvoTipo"]): string[] =>
  unicos(atividades.filter((a) => a.alvoTipo === alvoTipo).map((a) => a.alvoId));

const refsDo = (atividades: Atividade[], tipo: Atividade["tipo"]): string[] =>
  unicos(atividades.filter((a) => a.tipo === tipo).map((a) => a.refId));

export const autorPublico = (uid: string, usuario: Usuario | undefined): AutorPost => ({
  uid,
  apelido: apelidoExibicao(usuario),
  fotoUrl: usuario?.fotoUrl ?? "",
});

const porChave = async <V>(
  chaves: string[],
  carregar: (chave: string) => Promise<V>,
): Promise<Map<string, V>> => {
  const valores = await Promise.all(chaves.map(carregar));
  return new Map(chaves.map((chave, i) => [chave, valores[i]]));
};

const carregarContexto = async (atividades: Atividade[], tokenUid: string): Promise<Contexto> => {
  const postIds = idsDo(atividades, "post");
  const telemetriaIds = idsDo(atividades, "telemetria");
  const roleIds = idsDo(atividades, "role");
  const realizados = unicos(
    atividades.filter((a) => a.tipo === "role_realizado").map((a) => a.alvoId),
  );

  const [posts, telemetrias, roles, avalLocal, avalEvento, curtidas] = await Promise.all([
    postFotoRepository.buscarPorIds(postIds),
    porChave(telemetriaIds, (id) => roleTelemetriaRepository.buscarPorId(id)),
    roleRepository.buscarPorIds(roleIds),
    usuarioLocalFeedbackRepository.buscarPorIds(refsDo(atividades, "avaliacao_local")),
    usuarioEventoFeedbackRepository.buscarPorIds(refsDo(atividades, "avaliacao_evento")),
    atividadeRepository.curtidasDe(tokenUid, atividades.map((a) => a.id)),
  ]);

  const marcas = posts.filter((p) => p.marcaTipo && p.marcaId);
  const localIds = unicos([
    ...idsDo(atividades, "local"),
    ...marcas.filter((p) => p.marcaTipo === "local").map((p) => p.marcaId as string),
  ]);
  const eventoIds = unicos([
    ...idsDo(atividades, "evento"),
    ...marcas.filter((p) => p.marcaTipo === "evento").map((p) => p.marcaId as string),
  ]);

  const [locais, eventos, confirmados, minhas, inscricoes, participantes] = await Promise.all([
    localRepository.buscarPorIds(localIds),
    eventoRepository.buscarPorIds(eventoIds),
    porChave(roleIds, (id) => usuarioRoleRepository.contarConfirmados(id)),
    porChave(roleIds, (id) => usuarioRoleRepository.buscarPorId(`${tokenUid}_${id}`)),
    porChave(idsDo(atividades, "evento"), (id) =>
      usuarioEventoRepository.buscarPorId(`${tokenUid}_${id}`)),
    porChave(realizados, async (id) =>
      (await usuarioRoleRepository.listarConfirmadosDoRole(id, MAX_PARTICIPANTES_CARD))
        .map((vinculo) => vinculo.usuarioId)),
  ]);

  const uids = unicos([
    ...atividades.map((a) => a.autorId),
    ...[...participantes.values()].flat(),
  ]);
  const usuarios = await usuarioRepository.buscarPorIds(uids);

  const telemetriasValidas = new Map<string, RoleTelemetria>();
  telemetrias.forEach((valor, chave) => {
    if (valor) telemetriasValidas.set(chave, valor);
  });

  return {
    tokenUid,
    usuarios: new Map(usuarios.map((u) => [u.uid, u])),
    posts: porId(posts),
    telemetrias: telemetriasValidas,
    roles: porId(roles),
    confirmados,
    minhasParticipacoes: minhas,
    participantes,
    eventos: porId(eventos),
    inscritos: new Set([...inscricoes].filter(([, v]) => v !== null).map(([k]) => k)),
    locais: porId(locais),
    avaliacoesLocal: porId(avalLocal),
    avaliacoesEvento: porId(avalEvento),
    curtidas,
  };
};

const nomeDoPonto = (ponto: {nome: string; endereco: string}): string =>
  ponto.nome?.trim() || ponto.endereco?.trim() || "";

const minhaParticipacao = (role: Role, ctx: Contexto): MinhaParticipacaoRole => {
  if (role.criadorId === ctx.tokenUid) return "confirmado";
  const vinculo = ctx.minhasParticipacoes.get(role.id);
  if (!vinculo) return "nenhuma";
  return vinculo.aceito ? "confirmado" : "pendente";
};

const alvoRole = (atividade: Atividade, ctx: Contexto): AlvoRoleAtividade | null => {
  const role = ctx.roles.get(atividade.alvoId);
  if (!role) return null;
  const alvo: AlvoRoleAtividade = {
    tipo: "role",
    id: role.id,
    titulo: role.titulo,
    fotoCapaUrl: role.fotoCapaUrl,
    ritmo: role.ritmo,
    acesso: role.acesso,
    dataHoraSaida: role.dataHoraSaida,
    saidaNome: nomeDoPonto(role.localSaida),
    destinoNome: nomeDoPonto(role.destinoFinal),
    confirmados: ctx.confirmados.get(role.id) ?? 0,
    jaSaiu: Date.parse(role.dataHoraSaida) <= Date.now(),
    minhaParticipacao: minhaParticipacao(role, ctx),
  };
  if (atividade.tipo === "role_realizado") {
    alvo.participantes = (ctx.participantes.get(role.id) ?? []).map((uid) => ({
      uid,
      fotoUrl: ctx.usuarios.get(uid)?.fotoUrl ?? "",
    }));
  }
  return alvo;
};

const marcaDoPost = (post: PostFoto, ctx: Contexto) => {
  if (!post.marcaTipo || !post.marcaId) return null;
  const nome = post.marcaTipo === "local" ?
    ctx.locais.get(post.marcaId)?.nome :
    ctx.eventos.get(post.marcaId)?.titulo;
  return nome ? {tipo: post.marcaTipo, id: post.marcaId, nome} : null;
};

/** `null` quando a origem sumiu (ou a telemetria deixou de ser pública). */
const alvoDe = (atividade: Atividade, ctx: Contexto): AlvoAtividade | null => {
  switch (atividade.tipo) {
  case "foto": {
    const post = ctx.posts.get(atividade.alvoId);
    if (!post) return null;
    return {
      tipo: "post",
      id: post.id,
      fotoUrl: post.fotoUrl,
      legenda: post.legenda,
      marca: marcaDoPost(post, ctx),
    };
  }
  case "telemetria": {
    const t = ctx.telemetrias.get(atividade.alvoId);
    if (!t || !t.publica) return null;
    return {
      tipo: "telemetria",
      id: t.id,
      titulo: t.titulo,
      distanciaKm: t.distanciaKm,
      tempoMovimentoSegundos: t.tempoMovimentoSegundos,
      velocidadeMediaKmh: t.velocidadeMediaKmh,
      inicioNome: nomeDoPonto(t.pontoInicio),
      fimNome: nomeDoPonto(t.pontoFim),
      tracadoResumo: resumirTracado(t.tracado ?? ""),
      medalhas: (t.medalhas ?? []).map((m) => ({
        conquistaId: m.conquistaId,
        nome: m.nome,
        novidade: m.novidade,
      })),
    };
  }
  case "role_criado":
  case "role_realizado":
  case "entrada_role":
    return alvoRole(atividade, ctx);
  case "inscricao_evento":
  case "album_evento": {
    const evento = ctx.eventos.get(atividade.alvoId);
    if (!evento) return null;
    if (atividade.tipo === "album_evento" && evento.albuns.length === 0) {
      return null;
    }
    return {
      tipo: "evento",
      id: evento.id,
      titulo: evento.titulo,
      fotoCapaUrl: evento.fotoCapaUrl,
      dataHoraAbertura: evento.dataHoraAbertura,
      localNome: nomeDoPonto(evento.local),
      encerrado: eventoEncerrouParaAvaliacao(evento),
      inscrito: ctx.inscritos.has(evento.id),
    };
  }
  case "avaliacao_local":
  case "avaliacao_evento": {
    const local = atividade.tipo === "avaliacao_local";
    const doc = local ?
      ctx.avaliacoesLocal.get(atividade.refId) :
      ctx.avaliacoesEvento.get(atividade.refId);
    const alvoNome = local ?
      ctx.locais.get(atividade.alvoId)?.nome :
      ctx.eventos.get(atividade.alvoId)?.titulo;
    if (!doc || !alvoNome) return null;
    return {
      tipo: "avaliacao",
      alvoTipo: local ? "local" : "evento",
      alvoId: atividade.alvoId,
      alvoNome,
      nota: doc.nota,
      comentario: doc.comentario,
      fotosUrls: doc.fotosUrls,
      recomendaComboio: doc.recomendaComboio,
    };
  }
  case "selo": {
    const local = ctx.locais.get(atividade.alvoId);
    if (!local) return null;
    return {tipo: "local", id: local.id, nome: local.nome, categoria: local.categoria};
  }
  default:
    return null;
  }
};

const totalComentarios = (atividade: Atividade, ctx: Contexto): number | null => {
  if (ehCompacto(atividade.tipo) || atividade.tipo === "album_evento") return null;
  if (atividade.tipo === "foto") return ctx.posts.get(atividade.alvoId)?.totalComentarios ?? 0;
  return atividade.totalComentarios;
};

const montarItem = (
  atividade: Atividade,
  alvo: AlvoAtividade,
  autores: string[],
  ctx: Contexto,
): ItemAtividade => {
  const grupo = autores.length > 1;
  const exibidos = autores.slice(0, MAX_AUTORES_EXIBIDOS);
  return {
    id: atividade.id,
    tipo: atividade.tipo,
    createdAt: atividade.createdAt,
    autor: autorPublico(exibidos[0], ctx.usuarios.get(exibidos[0])),
    outrosAutores: exibidos.slice(1).map((uid) => autorPublico(uid, ctx.usuarios.get(uid))),
    totalAutores: autores.length,
    podeCurtir: !grupo,
    curtidoPorMim: !grupo && ctx.curtidas.has(atividade.id),
    totalCurtidas: grupo ? 0 : atividade.totalCurtidas,
    totalComentarios: totalComentarios(atividade, ctx),
    alvo,
  };
};

/** Mesmo formato do post (SPEC 057). Apaga quem escreveu ou o dono do item. */
export const paraComentariosPublicos = async (
  comentarios: {id: string; usuarioId: string; texto: string; createdAt: string}[],
  donoUid: string,
  tokenUid: string,
): Promise<ComentarioPublico[]> => {
  const uids = unicos(comentarios.map((c) => c.usuarioId));
  const usuarios = await usuarioRepository.buscarPorIds(uids);
  const porUid = new Map(usuarios.map((u) => [u.uid, u]));
  return comentarios.map((c) => ({
    id: c.id,
    texto: c.texto,
    createdAt: c.createdAt,
    podeApagar: tokenUid === c.usuarioId || tokenUid === donoUid,
    autor: autorPublico(c.usuarioId, porUid.get(c.usuarioId)),
  }));
};

/** Some com a origem: remove sem segurar a resposta. */
export const removerSumidas = (ids: string[]): void => {
  for (const id of ids) {
    atividadeRepository.remover(id).catch((error) => {
      log.warn("Atividade", "Falha ao remover atividade sem origem", {id, ...erroDe(error)});
    });
  }
};

/**
 * Hidrata a página. `sumidas` são as atividades cuja origem não existe mais.
 * Com `agrupar`, compactos iguais sobre o mesmo alvo viram um item só.
 */
export const montarItens = async (
  atividades: Atividade[],
  tokenUid: string,
  agrupar: boolean,
): Promise<{itens: ItemAtividade[]; sumidas: string[]}> => {
  if (atividades.length === 0) return {itens: [], sumidas: []};
  const ctx = await carregarContexto(atividades, tokenUid);
  const alvos = new Map<string, AlvoAtividade>();
  const sumidas: string[] = [];
  for (const atividade of atividades) {
    const alvo = alvoDe(atividade, ctx);
    if (alvo) alvos.set(atividade.id, alvo);
    else sumidas.push(atividade.id);
  }
  const validas = atividades.filter((a) => alvos.has(a.id));
  const grupos = agrupar ?
    agruparCompactos(validas) :
    validas.map((principal) => ({principal, autores: [principal.autorId]}));
  const itens = grupos.map(({principal, autores}) =>
    montarItem(principal, alvos.get(principal.id) as AlvoAtividade, autores, ctx));
  return {itens, sumidas};
};
