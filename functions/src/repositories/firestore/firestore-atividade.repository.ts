import type {DocumentSnapshot, Query} from "firebase-admin/firestore";
import {FieldPath, FieldValue, Timestamp} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import {idAtividade} from "../../lib/atividade";
import {erroDe, log} from "../../lib/log";
import type {
  AlvoTipoAtividade,
  Atividade,
  AtividadeCreate,
  ComentarioAtividade,
  ComentarioAtividadeCreate,
  PaginaAtividades,
  ResultadoComentarAtividade,
  ResultadoCurtida,
  TipoAtividade,
} from "../../types/atividade";
import {LIMITE_PAGINA_COMENTARIOS_ATIVIDADE} from "../../types/atividade";
import type {Pagina} from "../../types/post-foto";
import type {AtividadeRepository} from "../interfaces/atividade.repository";
import {toIso, toTimestamp} from "./mapper";

const COLECAO = "atividades";
const COLECAO_CURTIDA = "atividadecurtida";
const COLECAO_COMENTARIO = "atividadecomentario";
const LOTE = 100;
const RODADAS = 50;
const LIMITE_ORIGEM = 2000;
const CODIGO_JA_EXISTE = 6;

const TIPOS = new Set<string>([
  "foto",
  "telemetria",
  "role_criado",
  "role_realizado",
  "avaliacao_local",
  "avaliacao_evento",
  "album_evento",
  "entrada_role",
  "inscricao_evento",
  "selo",
]);
const ALVOS = new Set<string>(["post", "telemetria", "role", "evento", "local"]);

const contador = (valor: unknown): number =>
  typeof valor === "number" && Number.isFinite(valor) && valor > 0 ? Math.floor(valor) : 0;

const idValido = (id: string): boolean => Boolean(id) && !id.includes("/");

const idCurtida = (usuarioId: string, atividadeId: string): string =>
  `${usuarioId}_${atividadeId}`;

const toAtividade = (snap: DocumentSnapshot): Atividade | null => {
  const data = snap.data() ?? {};
  const tipo = String(data.tipo ?? "");
  const alvoTipo = String(data.alvoTipo ?? "");
  if (!TIPOS.has(tipo) || !ALVOS.has(alvoTipo)) {
    return null;
  }
  return {
    id: snap.id,
    tipo: tipo as TipoAtividade,
    autorId: String(data.autorId ?? ""),
    alvoTipo: alvoTipo as AlvoTipoAtividade,
    alvoId: String(data.alvoId ?? ""),
    refId: String(data.refId ?? ""),
    totalCurtidas: contador(data.totalCurtidas),
    totalComentarios: contador(data.totalComentarios),
    createdAt: toIso(data.createdAt),
  };
};

const toComentario = (snap: DocumentSnapshot): ComentarioAtividade => {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    atividadeId: String(data.atividadeId ?? ""),
    usuarioId: String(data.usuarioId ?? ""),
    texto: String(data.texto ?? ""),
    createdAt: toIso(data.createdAt),
  };
};

const docAtividade = (dados: AtividadeCreate) => ({
  tipo: dados.tipo,
  autorId: dados.autorId,
  alvoTipo: dados.alvoTipo,
  alvoId: dados.alvoId,
  refId: dados.refId,
  totalCurtidas: 0,
  totalComentarios: 0,
  createdAt: toTimestamp(dados.createdAt),
});

const apagarOndeIgual = async (colecao: string, campo: string, valor: string): Promise<void> => {
  for (let rodada = 0; rodada < RODADAS; rodada += 1) {
    const snap = await firestore.collection(colecao).where(campo, "==", valor).limit(LOTE).get();
    if (snap.empty) return;
    const lote = firestore.batch();
    snap.docs.forEach((doc) => lote.delete(doc.ref));
    await lote.commit();
    if (snap.size < LOTE) return;
  }
};

const desde = (colecao: string, campo: string, inicio: Date): Promise<DocumentSnapshot[]> =>
  firestore
    .collection(colecao)
    .where(campo, ">=", Timestamp.fromDate(inicio))
    .limit(LIMITE_ORIGEM)
    .get()
    .then((snap) => snap.docs);

export class FirestoreAtividadeRepository implements AtividadeRepository {
  async registrar(dados: AtividadeCreate): Promise<boolean> {
    try {
      await firestore.collection(COLECAO).doc(dados.id).create(docAtividade(dados));
      return true;
    } catch (error) {
      if ((error as {code?: number}).code === CODIGO_JA_EXISTE) {
        return false;
      }
      throw error;
    }
  }

  async buscarPorId(id: string): Promise<Atividade | null> {
    if (!idValido(id)) return null;
    const snap = await firestore.collection(COLECAO).doc(id).get();
    return snap.exists ? toAtividade(snap) : null;
  }

  async remover(id: string): Promise<void> {
    if (!idValido(id)) return;
    await apagarOndeIgual(COLECAO_CURTIDA, "atividadeId", id);
    await apagarOndeIgual(COLECAO_COMENTARIO, "atividadeId", id);
    await firestore.collection(COLECAO).doc(id).delete();
  }

  async removerPorAlvo(
    alvoTipo: AlvoTipoAtividade,
    alvoId: string,
    tipos: TipoAtividade[],
  ): Promise<number> {
    if (!idValido(alvoId)) return 0;
    const aceitos = new Set<string>(tipos);
    const snap = await firestore.collection(COLECAO).where("alvoId", "==", alvoId).get();
    const alvos = snap.docs.filter((doc) =>
      doc.get("alvoTipo") === alvoTipo && aceitos.has(String(doc.get("tipo"))));
    for (const doc of alvos) {
      await this.remover(doc.id);
    }
    return alvos.length;
  }

  async paginaPorAutores(
    lotes: string[][],
    cursor: string | null,
    limitePorLote: number,
  ): Promise<PaginaAtividades> {
    let cursorSnap: DocumentSnapshot | null = null;
    if (cursor) {
      if (!idValido(cursor)) return {ok: false};
      cursorSnap = await firestore.collection(COLECAO).doc(cursor).get();
      if (!cursorSnap.exists) return {ok: false};
    }
    const listas = await Promise.all(lotes.map(async (lote) => {
      let consulta: Query = firestore
        .collection(COLECAO)
        .where("autorId", "in", lote)
        .orderBy("createdAt", "desc")
        .orderBy(FieldPath.documentId(), "desc");
      if (cursorSnap) {
        consulta = consulta.startAfter(cursorSnap.get("createdAt"), cursorSnap.id);
      }
      const snap = await consulta.limit(limitePorLote).get();
      return snap.docs.map(toAtividade).filter((item): item is Atividade => item !== null);
    }));
    return {ok: true, listas};
  }

  async contarNovidades(lotes: string[][], desdeId: string, limite: number): Promise<number> {
    if (!idValido(desdeId)) return 0;
    const ref = await firestore.collection(COLECAO).doc(desdeId).get();
    if (!ref.exists) return 0;
    const marco = ref.get("createdAt");
    const contagens = await Promise.all(lotes.map(async (lote) => {
      const snap = await firestore
        .collection(COLECAO)
        .where("autorId", "in", lote)
        .where("createdAt", ">", marco)
        .orderBy("createdAt", "desc")
        .limit(limite)
        .count()
        .get();
      return snap.data().count;
    }));
    return Math.min(limite, contagens.reduce((soma, n) => soma + n, 0));
  }

  async curtidasDe(usuarioId: string, atividadeIds: string[]): Promise<Set<string>> {
    const ids = [...new Set(atividadeIds)].filter(idValido);
    const curtidas = new Set<string>();
    for (let i = 0; i < ids.length; i += LOTE) {
      const fatia = ids.slice(i, i + LOTE);
      const snaps = await firestore.getAll(
        ...fatia.map((id) => firestore.collection(COLECAO_CURTIDA).doc(idCurtida(usuarioId, id))),
      );
      snaps.forEach((snap, indice) => {
        if (snap.exists) curtidas.add(fatia[indice]);
      });
    }
    return curtidas;
  }

  async curtir(
    usuarioId: string,
    atividadeId: string,
    criarSeAusente?: AtividadeCreate,
  ): Promise<ResultadoCurtida> {
    if (!idValido(atividadeId)) return {tipo: "ausente"};
    const ref = firestore.collection(COLECAO).doc(atividadeId);
    const curtidaRef = firestore.collection(COLECAO_CURTIDA).doc(idCurtida(usuarioId, atividadeId));
    return firestore.runTransaction(async (tx): Promise<ResultadoCurtida> => {
      const [atividade, curtida] = await Promise.all([tx.get(ref), tx.get(curtidaRef)]);
      if (!atividade.exists && !criarSeAusente) {
        return {tipo: "ausente"};
      }
      const atual = atividade.exists ? contador(atividade.get("totalCurtidas")) : 0;
      if (curtida.exists) {
        return {tipo: "ok", mudou: false, totalCurtidas: atual};
      }
      if (!atividade.exists && criarSeAusente) {
        tx.create(ref, {...docAtividade(criarSeAusente), totalCurtidas: 1});
      } else {
        tx.update(ref, {totalCurtidas: atual + 1});
      }
      tx.create(curtidaRef, {
        usuarioId,
        atividadeId,
        createdAt: FieldValue.serverTimestamp(),
      });
      return {tipo: "ok", mudou: true, totalCurtidas: atual + 1};
    });
  }

  async descurtir(usuarioId: string, atividadeId: string): Promise<ResultadoCurtida> {
    if (!idValido(atividadeId)) return {tipo: "ausente"};
    const ref = firestore.collection(COLECAO).doc(atividadeId);
    const curtidaRef = firestore.collection(COLECAO_CURTIDA).doc(idCurtida(usuarioId, atividadeId));
    return firestore.runTransaction(async (tx): Promise<ResultadoCurtida> => {
      const [atividade, curtida] = await Promise.all([tx.get(ref), tx.get(curtidaRef)]);
      if (!atividade.exists) {
        return {tipo: "ausente"};
      }
      const atual = contador(atividade.get("totalCurtidas"));
      if (!curtida.exists) {
        return {tipo: "ok", mudou: false, totalCurtidas: atual};
      }
      const total = Math.max(0, atual - 1);
      tx.delete(curtidaRef);
      tx.update(ref, {totalCurtidas: total});
      return {tipo: "ok", mudou: true, totalCurtidas: total};
    });
  }

  async listarComentarios(
    atividadeId: string,
    cursor: string | null,
  ): Promise<Pagina<ComentarioAtividade>> {
    if (cursor !== null && !idValido(cursor)) return {ok: false};
    let consulta = firestore
      .collection(COLECAO_COMENTARIO)
      .where("atividadeId", "==", atividadeId)
      .orderBy("createdAt", "desc")
      .limit(LIMITE_PAGINA_COMENTARIOS_ATIVIDADE);
    if (cursor) {
      const cursorSnap = await firestore.collection(COLECAO_COMENTARIO).doc(cursor).get();
      if (!cursorSnap.exists || cursorSnap.get("atividadeId") !== atividadeId) {
        return {ok: false};
      }
      consulta = consulta.startAfter(cursorSnap);
    }
    const snap = await consulta.get();
    const itens = snap.docs.map(toComentario);
    const ultimo = itens[itens.length - 1];
    return {
      ok: true,
      itens,
      proximoCursor: snap.size === LIMITE_PAGINA_COMENTARIOS_ATIVIDADE && ultimo ? ultimo.id : null,
    };
  }

  async buscarComentario(id: string): Promise<ComentarioAtividade | null> {
    if (!idValido(id)) return null;
    const snap = await firestore.collection(COLECAO_COMENTARIO).doc(id).get();
    return snap.exists ? toComentario(snap) : null;
  }

  async comentar(dados: ComentarioAtividadeCreate): Promise<ResultadoComentarAtividade> {
    if (!idValido(dados.atividadeId)) return {tipo: "ausente"};
    const atividadeRef = firestore.collection(COLECAO).doc(dados.atividadeId);
    const ref = firestore.collection(COLECAO_COMENTARIO).doc();
    const criou = await firestore.runTransaction(async (tx) => {
      const atividade = await tx.get(atividadeRef);
      if (!atividade.exists) return false;
      tx.create(ref, {
        atividadeId: dados.atividadeId,
        usuarioId: dados.usuarioId,
        texto: dados.texto,
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.update(atividadeRef, {
        totalComentarios: contador(atividade.get("totalComentarios")) + 1,
      });
      return true;
    });
    if (!criou) return {tipo: "ausente"};
    const comentario = await this.buscarComentario(ref.id);
    return {tipo: "criado", comentario: comentario as ComentarioAtividade};
  }

  async apagarComentario(comentario: ComentarioAtividade): Promise<void> {
    const ref = firestore.collection(COLECAO_COMENTARIO).doc(comentario.id);
    const atividadeRef = idValido(comentario.atividadeId) ?
      firestore.collection(COLECAO).doc(comentario.atividadeId) :
      null;
    await firestore.runTransaction(async (tx) => {
      const atual = await tx.get(ref);
      if (!atual.exists) return;
      const atividade = atividadeRef ? await tx.get(atividadeRef) : null;
      tx.delete(ref);
      if (atividadeRef && atividade?.exists) {
        tx.update(atividadeRef, {
          totalComentarios: Math.max(0, contador(atividade.get("totalComentarios")) - 1),
        });
      }
    });
  }

  async limparPorUsuario(usuarioId: string): Promise<void> {
    for (let rodada = 0; rodada < RODADAS; rodada += 1) {
      const snap = await firestore
        .collection(COLECAO)
        .where("autorId", "==", usuarioId)
        .limit(LOTE)
        .get();
      if (snap.empty) break;
      for (const doc of snap.docs) {
        await this.remover(doc.id);
      }
      if (snap.size < LOTE) break;
    }

    for (let rodada = 0; rodada < RODADAS; rodada += 1) {
      const snap = await firestore
        .collection(COLECAO_CURTIDA)
        .where("usuarioId", "==", usuarioId)
        .limit(LOTE)
        .get();
      if (snap.empty) break;
      for (const doc of snap.docs) {
        await this.descurtirOuApagar(usuarioId, doc);
      }
      if (snap.size < LOTE) break;
    }

    const vistos = new Set<string>();
    for (let rodada = 0; rodada < RODADAS; rodada += 1) {
      const snap = await firestore
        .collection(COLECAO_COMENTARIO)
        .where("usuarioId", "==", usuarioId)
        .limit(LOTE)
        .get();
      const novos = snap.docs.filter((doc) => !vistos.has(doc.id));
      if (novos.length === 0) break;
      for (const doc of novos) {
        vistos.add(doc.id);
        try {
          await this.apagarComentario(toComentario(doc));
        } catch (error) {
          log.warn("Atividade", "Falha ao apagar comentário na exclusão", {
            usuarioId,
            comentarioId: doc.id,
            ...erroDe(error),
          });
        }
      }
      if (snap.size < LOTE) break;
    }
  }

  async listarOrigensDesde(inicio: Date): Promise<AtividadeCreate[]> {
    const [posts, telemetrias, roles, vinculos, inscricoes, avalLocal, avalEvento] =
      await Promise.all([
        desde("userspostfoto", "createdAt", inicio),
        desde("rolestelemetria", "createdAt", inicio),
        desde("roles", "createdAt", inicio),
        desde("usersrole", "aceitoEm", inicio),
        desde("usersevento", "createdAt", inicio),
        desde("userslocalfeedback", "createdAt", inicio),
        desde("userseventofeedback", "createdAt", inicio),
      ]);
    const texto = (doc: DocumentSnapshot, campo: string) => String(doc.get(campo) ?? "");
    const quando = (doc: DocumentSnapshot, campo = "createdAt") => toIso(doc.get(campo));
    const itens: AtividadeCreate[] = [];
    const juntar = (montar: () => AtividadeCreate) => {
      try {
        itens.push(montar());
      } catch {
        // Doc com id ou campo inválido fica fora da carga.
      }
    };

    posts.forEach((doc) => juntar(() => ({
      id: idAtividade("foto", [doc.id]),
      tipo: "foto",
      autorId: texto(doc, "usuarioId"),
      alvoTipo: "post",
      alvoId: doc.id,
      refId: doc.id,
      createdAt: quando(doc),
    })));
    telemetrias
      .filter((doc) => doc.get("publica") !== false)
      .forEach((doc) => juntar(() => ({
        id: idAtividade("telemetria", [doc.id]),
        tipo: "telemetria",
        autorId: texto(doc, "usuarioId"),
        alvoTipo: "telemetria",
        alvoId: doc.id,
        refId: doc.id,
        createdAt: quando(doc),
      })));
    roles.forEach((doc) => juntar(() => ({
      id: idAtividade("role_criado", [doc.id]),
      tipo: "role_criado",
      autorId: texto(doc, "criadorId"),
      alvoTipo: "role",
      alvoId: doc.id,
      refId: doc.id,
      createdAt: quando(doc),
    })));
    vinculos
      .filter((doc) => doc.get("aceito") === true)
      .forEach((doc) => juntar(() => ({
        id: idAtividade("entrada_role", [texto(doc, "usuarioId"), texto(doc, "roleId")]),
        tipo: "entrada_role",
        autorId: texto(doc, "usuarioId"),
        alvoTipo: "role",
        alvoId: texto(doc, "roleId"),
        refId: doc.id,
        createdAt: quando(doc, "aceitoEm"),
      })));
    inscricoes.forEach((doc) => juntar(() => ({
      id: idAtividade("inscricao_evento", [texto(doc, "usuarioId"), texto(doc, "eventoId")]),
      tipo: "inscricao_evento",
      autorId: texto(doc, "usuarioId"),
      alvoTipo: "evento",
      alvoId: texto(doc, "eventoId"),
      refId: doc.id,
      createdAt: quando(doc),
    })));
    avalLocal.forEach((doc) => juntar(() => ({
      id: idAtividade("avaliacao_local", [doc.id]),
      tipo: "avaliacao_local",
      autorId: texto(doc, "usuarioId"),
      alvoTipo: "local",
      alvoId: texto(doc, "localId"),
      refId: doc.id,
      createdAt: quando(doc),
    })));
    avalEvento.forEach((doc) => juntar(() => ({
      id: idAtividade("avaliacao_evento", [doc.id]),
      tipo: "avaliacao_evento",
      autorId: texto(doc, "usuarioId"),
      alvoTipo: "evento",
      alvoId: texto(doc, "eventoId"),
      refId: doc.id,
      createdAt: quando(doc),
    })));
    return itens.filter((item) => item.autorId && item.alvoId);
  }

  private async descurtirOuApagar(usuarioId: string, curtida: DocumentSnapshot): Promise<void> {
    const atividadeId = String(curtida.get("atividadeId") ?? "");
    try {
      if (idValido(atividadeId)) {
        const resultado = await this.descurtir(usuarioId, atividadeId);
        if (resultado.tipo === "ok") return;
      }
      await curtida.ref.delete();
    } catch (error) {
      log.warn("Atividade", "Falha ao remover curtida na exclusão", {
        usuarioId,
        curtidaId: curtida.id,
        ...erroDe(error),
      });
    }
  }
}
