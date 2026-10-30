import {FieldValue, type DocumentSnapshot} from "firebase-admin/firestore";
import {firestore} from "../../lib/firebase-admin";
import {
  SugestaoEventoJaDecididaError,
  SugestaoEventoNaoEncontradaError,
} from "../../lib/sugestoes-evento/erros";
import type {AcessoEvento, Evento, TipoEvento} from "../../types/evento";
import {ACESSOS_EVENTO, TIPOS_EVENTO} from "../../types/evento";
import type {Localizacao} from "../../types/role";
import type {
  AprovarSugestaoEvento,
  FonteSugestaoEvento,
  StatusSugestaoEvento,
  SugestaoEvento,
  SugestaoEventoNova,
} from "../../types/sugestao-evento";
import type {SugestaoEventoRepository} from "../interfaces/sugestao-evento.repository";
import {toIso, toIsoOrNull, toTimestamp} from "./mapper";

const COLECAO = "sugestoesEvento";
const EVENTOS = "eventos";

const STATUSES: StatusSugestaoEvento[] = ["pendente", "aprovada", "recusada"];

const jaExiste = (error: unknown): boolean => {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }
  const code = (error as {code: unknown}).code;
  return code === 6 || code === "already-exists";
};

const toTipo = (valor: unknown): TipoEvento =>
  (TIPOS_EVENTO as string[]).includes(String(valor)) ?
    (valor as TipoEvento) :
    "moto_point";

const toAcesso = (valor: unknown): AcessoEvento =>
  (ACESSOS_EVENTO as string[]).includes(String(valor)) ?
    (valor as AcessoEvento) :
    "gratis";

const toStatus = (valor: unknown): StatusSugestaoEvento =>
  STATUSES.includes(valor as StatusSugestaoEvento) ?
    (valor as StatusSugestaoEvento) :
    "pendente";

const toLocal = (valor: unknown): Localizacao => {
  const objeto = valor && typeof valor === "object" ?
    valor as Record<string, unknown> :
    {};
  return {
    lat: Number(objeto.lat ?? 0),
    lng: Number(objeto.lng ?? 0),
    endereco: String(objeto.endereco ?? ""),
    nome: String(objeto.nome ?? ""),
  };
};

const toSugestao = (snap: DocumentSnapshot): SugestaoEvento => {
  const data = snap.data() ?? {};
  const motivos = Array.isArray(data.motivos) ?
    data.motivos.filter((item): item is string => typeof item === "string").slice(0, 3) :
    [];
  return {
    id: snap.id,
    fonte: "motoclub" satisfies FonteSugestaoEvento,
    slug: String(data.slug ?? ""),
    urlOrigem: String(data.urlOrigem ?? ""),
    titulo: String(data.titulo ?? ""),
    tipoSugerido: toTipo(data.tipoSugerido),
    local: toLocal(data.local),
    dataHoraAbertura: toIso(data.dataHoraAbertura),
    dataHoraEncerramento: toIsoOrNull(data.dataHoraEncerramento),
    acesso: toAcesso(data.acesso),
    linkIngresso: typeof data.linkIngresso === "string" && data.linkIngresso ?
      data.linkIngresso :
      null,
    informacoes: String(data.informacoes ?? ""),
    fotoCapaUrl: String(data.fotoCapaUrl ?? ""),
    nota: Number(data.nota ?? 0),
    motivos,
    cidade: String(data.cidade ?? ""),
    status: toStatus(data.status),
    eventoId: typeof data.eventoId === "string" && data.eventoId ? data.eventoId : null,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
};

const camposEvento = (dados: AprovarSugestaoEvento) => ({
  titulo: dados.titulo,
  tipo: dados.tipo,
  local: dados.local,
  localId: null,
  dataHoraAbertura: toTimestamp(dados.dataHoraAbertura),
  dataHoraEncerramento: dados.dataHoraEncerramento ?
    toTimestamp(dados.dataHoraEncerramento) :
    null,
  acesso: dados.acesso,
  linkIngresso: dados.linkIngresso,
  atracoes: [],
  fotoCapaUrl: dados.fotoCapaUrl,
  informacoes: dados.informacoes,
  criadorId: dados.criadorId,
  notaMedia: 0,
  totalAvaliacoes: 0,
  recomendacoesComboio: 0,
  somaNotas: 0,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
});

export class FirestoreSugestaoEventoRepository implements SugestaoEventoRepository {
  async listarPorStatus(status: StatusSugestaoEvento): Promise<SugestaoEvento[]> {
    const snap = await firestore.collection(COLECAO).where("status", "==", status).get();
    return snap.docs
      .map(toSugestao)
      .sort((a, b) => b.nota - a.nota || a.dataHoraAbertura.localeCompare(b.dataHoraAbertura));
  }

  async listarIds(): Promise<string[]> {
    const snap = await firestore.collection(COLECAO).select("status").get();
    return snap.docs.map((doc) => doc.id);
  }

  async buscarPorId(id: string): Promise<SugestaoEvento | null> {
    const snap = await firestore.collection(COLECAO).doc(id).get();
    if (!snap.exists) {
      return null;
    }
    return toSugestao(snap);
  }

  async criar(dados: SugestaoEventoNova): Promise<boolean> {
    try {
      await firestore.collection(COLECAO).doc(dados.id).create({
        fonte: dados.fonte,
        slug: dados.slug,
        urlOrigem: dados.urlOrigem,
        titulo: dados.titulo,
        tipoSugerido: dados.tipoSugerido,
        local: dados.local,
        dataHoraAbertura: toTimestamp(dados.dataHoraAbertura),
        dataHoraEncerramento: dados.dataHoraEncerramento ?
          toTimestamp(dados.dataHoraEncerramento) :
          null,
        acesso: dados.acesso,
        linkIngresso: dados.linkIngresso,
        informacoes: dados.informacoes,
        fotoCapaUrl: dados.fotoCapaUrl,
        nota: dados.nota,
        motivos: dados.motivos.slice(0, 3),
        cidade: dados.cidade,
        status: "pendente",
        eventoId: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return true;
    } catch (error) {
      if (jaExiste(error)) {
        return false;
      }
      throw error;
    }
  }

  async aprovar(id: string, dados: AprovarSugestaoEvento): Promise<Evento> {
    const sugRef = firestore.collection(COLECAO).doc(id);
    const eventoRef = firestore.collection(EVENTOS).doc();
    await firestore.runTransaction(async (tx) => {
      const snap = await tx.get(sugRef);
      if (!snap.exists) {
        throw new SugestaoEventoNaoEncontradaError();
      }
      if (String(snap.get("status") ?? "") !== "pendente") {
        throw new SugestaoEventoJaDecididaError();
      }
      tx.set(eventoRef, camposEvento(dados));
      tx.update(sugRef, {
        status: "aprovada",
        eventoId: eventoRef.id,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    const criado = await firestore.collection(EVENTOS).doc(eventoRef.id).get();
    if (!criado.exists) {
      throw new Error("Evento aprovado não encontrado");
    }
    const data = criado.data() ?? {};
    return {
      id: criado.id,
      titulo: String(data.titulo ?? ""),
      tipo: toTipo(data.tipo),
      local: toLocal(data.local),
      localId: null,
      dataHoraAbertura: toIso(data.dataHoraAbertura),
      dataHoraEncerramento: toIsoOrNull(data.dataHoraEncerramento),
      acesso: toAcesso(data.acesso),
      linkIngresso: typeof data.linkIngresso === "string" ? data.linkIngresso : null,
      atracoes: [],
      fotoCapaUrl: String(data.fotoCapaUrl ?? ""),
      informacoes: String(data.informacoes ?? ""),
      criadorId: String(data.criadorId ?? ""),
      notaMedia: 0,
      totalAvaliacoes: 0,
      recomendacoesComboio: 0,
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt),
    };
  }

  async recusar(id: string): Promise<void> {
    const ref = firestore.collection(COLECAO).doc(id);
    await firestore.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        throw new SugestaoEventoNaoEncontradaError();
      }
      if (String(snap.get("status") ?? "") !== "pendente") {
        throw new SugestaoEventoJaDecididaError();
      }
      tx.update(ref, {
        status: "recusada",
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  }
}
