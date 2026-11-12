import {
  localRepository,
  ofertaLocalRepository,
  usuarioRepository,
} from "../repositories";
import type {OfertaLocal, OfertaVigenteResumo} from "../types/oferta-local";
import {ofertaDoCard, resumoVigente} from "./oferta-local";

export type PapelNoLocal = {dono: boolean; admin: boolean};

/** Dono pelo `donoId`; admin pelo documento `users`, como `exigirAdmin`. */
export const papelNoLocal = async (
  uid: string,
  donoId: string | null,
): Promise<PapelNoLocal> => {
  if (donoId === uid) {
    return {dono: true, admin: false};
  }
  const perfil = await usuarioRepository.buscarPorId(uid);
  return {dono: false, admin: perfil?.admin === true};
};

/** `donoId` volta a `null` e as ofertas do local pausam. */
export const soltarDono = async (localId: string): Promise<void> => {
  await localRepository.definirDono(localId, null);
  await ofertaLocalRepository.pausarPorLocal(localId);
};

export const soltarLocaisDoUsuario = async (uid: string): Promise<void> => {
  const locais = await localRepository.listarPorDono(uid);
  for (const local of locais) {
    await soltarDono(local.id);
  }
};

/** Oferta do card por local, entre as ativas. */
export const ofertasVigentesPorLocal = async (
  agora: Date,
): Promise<Map<string, OfertaVigenteResumo>> => {
  const porLocal = new Map<string, OfertaLocal[]>();
  for (const oferta of await ofertaLocalRepository.listarAtivas()) {
    const lista = porLocal.get(oferta.localId) ?? [];
    lista.push(oferta);
    porLocal.set(oferta.localId, lista);
  }
  const saida = new Map<string, OfertaVigenteResumo>();
  for (const [localId, ofertas] of porLocal) {
    const escolhida = ofertaDoCard(ofertas, agora);
    if (escolhida) {
      saida.set(localId, resumoVigente(escolhida));
    }
  }
  return saida;
};
