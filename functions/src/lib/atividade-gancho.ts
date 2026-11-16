import {atividadeRepository} from "../repositories";
import {idAtividade} from "./atividade";
import {erroDe, log} from "./log";
import type {
  AlvoTipoAtividade,
  AtividadeCreate,
  TipoAtividade,
} from "../types/atividade";

type Registro = Omit<AtividadeCreate, "id"> & {partes: string[]};

/** Falha só vira warn: a rota de origem segue com o mesmo status. */
export const registrarAtividade = async ({partes, ...dados}: Registro): Promise<void> => {
  try {
    await atividadeRepository.registrar({...dados, id: idAtividade(dados.tipo, partes)});
  } catch (error) {
    log.warn("Atividade", "Falha ao registrar atividade", {
      tipo: dados.tipo,
      alvoId: dados.alvoId,
      ...erroDe(error),
    });
  }
};

export const removerAtividade = async (tipo: TipoAtividade, partes: string[]): Promise<void> => {
  try {
    await atividadeRepository.remover(idAtividade(tipo, partes));
  } catch (error) {
    log.warn("Atividade", "Falha ao remover atividade", {tipo, partes, ...erroDe(error)});
  }
};

export const removerAtividadesDoAlvo = async (
  alvoTipo: AlvoTipoAtividade,
  alvoId: string,
  tipos: TipoAtividade[],
): Promise<void> => {
  try {
    await atividadeRepository.removerPorAlvo(alvoTipo, alvoId, tipos);
  } catch (error) {
    log.warn("Atividade", "Falha ao remover atividades do alvo", {
      alvoTipo,
      alvoId,
      ...erroDe(error),
    });
  }
};
