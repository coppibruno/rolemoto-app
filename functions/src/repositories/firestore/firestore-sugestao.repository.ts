import {Timestamp} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import {
  dispensaVigente,
  idDispensa,
  instanteDispensa,
  telemetriaEhPublica,
} from "../../lib/sugestao-piloto";
import {toIso} from "./mapper";
import type {
  FotoJanela,
  PontoCatalogo,
  PontoEvento,
  RoleJanela,
  StoryJanela,
  SugestaoRepository,
  TelemetriaJanela,
} from "../interfaces/sugestao.repository";

const COLECAO = "userssugestaodispensa";
const LOTE = 100;
const RODADAS = 50;
const TETO_JANELA = 80;
const TETO_PUBLICACAO = 40;
const TETO_CATALOGO = 40;

const ateDe = (valor: unknown): Date | null => {
  if (valor instanceof Timestamp) {
    return valor.toDate();
  }
  if (valor instanceof Date) {
    return valor;
  }
  return null;
};

const textoOuNull = (valor: unknown): string | null => {
  if (typeof valor !== "string") {
    return null;
  }
  const limpo = valor.trim();
  return limpo || null;
};

const numeroDe = (valor: unknown): number | null => {
  if (typeof valor !== "number" || !Number.isFinite(valor)) {
    return null;
  }
  return valor;
};

const idsUnicos = (ids: string[]): string[] =>
  [...new Set(ids.filter(Boolean))].slice(0, TETO_CATALOGO);

export class FirestoreSugestaoRepository implements SugestaoRepository {
  async dispensar(usuarioId: string, dispensadoId: string): Promise<void> {
    const id = idDispensa(usuarioId, dispensadoId);
    const ref = firestore.collection(COLECAO).doc(id);
    const ate = Timestamp.fromDate(instanteDispensa(new Date()));
    await firestore.runTransaction(async (tx) => {
      await tx.get(ref);
      tx.set(ref, {
        id,
        usuarioId,
        dispensadoId,
        ate,
      });
    });
  }

  async listarDispensadosVigentes(
    usuarioId: string,
    agora: Date,
  ): Promise<string[]> {
    const snap = await firestore
      .collection(COLECAO)
      .where("usuarioId", "==", usuarioId)
      .limit(LOTE)
      .get();
    const ids: string[] = [];
    for (const doc of snap.docs) {
      const ate = ateDe(doc.get("ate"));
      const dispensadoId = String(doc.get("dispensadoId") ?? "");
      if (!ate || !dispensadoId || !dispensaVigente(ate, agora)) {
        continue;
      }
      ids.push(dispensadoId);
    }
    return ids;
  }

  async limparPorUsuario(uid: string): Promise<void> {
    await this.apagarPorCampo("usuarioId", uid);
    await this.apagarPorCampo("dispensadoId", uid);
  }

  async listarRolesJanela(inicio: Date, fim: Date): Promise<RoleJanela[]> {
    const snap = await firestore
      .collection("roles")
      .where("dataHoraSaida", ">=", Timestamp.fromDate(inicio))
      .where("dataHoraSaida", "<=", Timestamp.fromDate(fim))
      .orderBy("dataHoraSaida", "asc")
      .limit(TETO_JANELA)
      .get();
    const itens: RoleJanela[] = [];
    for (const doc of snap.docs) {
      const data = doc.data();
      const saida = data.localSaida as {lat?: unknown; lng?: unknown} | undefined;
      const lat = numeroDe(saida?.lat);
      const lng = numeroDe(saida?.lng);
      const criadorId = String(data.criadorId ?? "");
      if (lat === null || lng === null || !criadorId) {
        continue;
      }
      itens.push({
        criadorId,
        titulo: String(data.titulo ?? ""),
        lat,
        lng,
        dataHoraSaida: toIso(data.dataHoraSaida),
      });
    }
    return itens;
  }

  async listarTelemetriasRecentes(desde: Date): Promise<TelemetriaJanela[]> {
    const snap = await firestore
      .collection("rolestelemetria")
      .where("encerradoEm", ">=", Timestamp.fromDate(desde))
      .orderBy("encerradoEm", "desc")
      .limit(TETO_JANELA)
      .get();
    const itens: TelemetriaJanela[] = [];
    for (const doc of snap.docs) {
      const data = doc.data();
      const ponto = data.pontoInicio as
        | {lat?: unknown; lng?: unknown; nome?: unknown}
        | undefined;
      const lat = numeroDe(ponto?.lat);
      const lng = numeroDe(ponto?.lng);
      const usuarioId = String(data.usuarioId ?? "");
      if (lat === null || lng === null || !usuarioId) {
        continue;
      }
      itens.push({
        usuarioId,
        nome: String(ponto?.nome ?? ""),
        lat,
        lng,
        publica: telemetriaEhPublica(data.publica),
        encerradoEm: toIso(data.encerradoEm),
      });
    }
    return itens;
  }

  async listarStoriesVivas(agora: Date): Promise<StoryJanela[]> {
    const snap = await firestore
      .collection("userslocalstory")
      .where("expiresAt", ">", Timestamp.fromDate(agora))
      .orderBy("expiresAt", "desc")
      .limit(TETO_PUBLICACAO)
      .get();
    const itens: StoryJanela[] = [];
    for (const doc of snap.docs) {
      const data = doc.data();
      const album = data.album;
      if (album !== "local" && album !== "evento" && album !== "perfil") {
        continue;
      }
      const usuarioId = String(data.usuarioId ?? "");
      if (!usuarioId) {
        continue;
      }
      itens.push({
        usuarioId,
        album,
        localId: textoOuNull(data.localId),
        eventoId: textoOuNull(data.eventoId),
        localizacaoNome: textoOuNull(data.localizacaoNome),
        localizacaoLat: numeroDe(data.localizacaoLat),
        localizacaoLng: numeroDe(data.localizacaoLng),
        createdAt: toIso(data.createdAt),
      });
    }
    return itens;
  }

  async listarFotosRecentes(desde: Date): Promise<FotoJanela[]> {
    const snap = await firestore
      .collection("userspostfoto")
      .where("createdAt", ">=", Timestamp.fromDate(desde))
      .orderBy("createdAt", "desc")
      .limit(TETO_PUBLICACAO)
      .get();
    const itens: FotoJanela[] = [];
    for (const doc of snap.docs) {
      const data = doc.data();
      const usuarioId = String(data.usuarioId ?? "");
      if (!usuarioId) {
        continue;
      }
      const marca = data.marcaTipo === "local" || data.marcaTipo === "evento" ?
        data.marcaTipo :
        null;
      itens.push({
        usuarioId,
        marcaTipo: marca,
        marcaId: textoOuNull(data.marcaId),
        createdAt: toIso(data.createdAt),
      });
    }
    return itens;
  }

  async listarLocais(ids: string[]): Promise<PontoCatalogo[]> {
    return this.lerPorIds(ids, "locais", (id, data) => {
      const lat = numeroDe(data.lat);
      const lng = numeroDe(data.lng);
      if (lat === null || lng === null) {
        return null;
      }
      return {id, nome: String(data.nome ?? ""), lat, lng};
    });
  }

  async listarEventos(ids: string[]): Promise<PontoEvento[]> {
    return this.lerPorIds(ids, "eventos", (id, data) => {
      const local = data.local as {lat?: unknown; lng?: unknown; nome?: unknown} | undefined;
      const lat = numeroDe(local?.lat);
      const lng = numeroDe(local?.lng);
      if (lat === null || lng === null) {
        return null;
      }
      return {
        id,
        localId: textoOuNull(data.localId),
        nome: String(local?.nome ?? ""),
        lat,
        lng,
      };
    });
  }

  private async lerPorIds<T>(
    ids: string[],
    colecao: string,
    mapear: (id: string, data: Record<string, unknown>) => T | null,
  ): Promise<T[]> {
    const unicos = idsUnicos(ids);
    if (unicos.length === 0) {
      return [];
    }
    const refs = unicos.map((id) => firestore.collection(colecao).doc(id));
    const snaps = await firestore.getAll(...refs);
    const itens: T[] = [];
    for (const snap of snaps) {
      if (!snap.exists) {
        continue;
      }
      const item = mapear(snap.id, snap.data() ?? {});
      if (item) {
        itens.push(item);
      }
    }
    return itens;
  }

  private async apagarPorCampo(
    campo: "usuarioId" | "dispensadoId",
    uid: string,
  ): Promise<void> {
    const vistos = new Set<string>();
    for (let rodada = 0; rodada < RODADAS; rodada += 1) {
      const snap = await firestore
        .collection(COLECAO)
        .where(campo, "==", uid)
        .limit(LOTE)
        .get();
      const novos = snap.docs.filter((doc) => !vistos.has(doc.id));
      if (novos.length === 0) {
        return;
      }
      const batch = firestore.batch();
      for (const doc of novos) {
        vistos.add(doc.id);
        batch.delete(doc.ref);
      }
      await batch.commit();
      if (snap.size < LOTE) {
        return;
      }
    }
  }
}
