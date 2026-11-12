import {cancelarLembreteEvento} from "./lembretes";
import {log} from "./log";
import {TETO_EXCECOES} from "./serie-evento";
import {apagarObjetoStory} from "./story-local";
import {
  conviteEventoRepository,
  eventoRepository,
  localRepository,
  ofertaLocalRepository,
  serieEventoRepository,
  storyLocalRepository,
  usuarioEventoFeedbackRepository,
  usuarioEventoRepository,
  usuarioLocalCheckinRepository,
  usuarioLocalFavoritoRepository,
  usuarioLocalFeedbackRepository,
  usuarioOfertaCupomRepository,
} from "../repositories";
import type {Evento} from "../types/evento";
import type {StoryLocal} from "../types/story-local";

const AVISO = "todos";
const LOTE_STORY = 100;
const RODADAS_STORY = 50;

export type ResultadoApagar = "ok" | "ausente";

type CampoStory = "localId" | "eventoId" | "marcaId";

const cancelarLembretesDoEvento = async (evento: Evento): Promise<void> => {
  const vinculos = await usuarioEventoRepository.listarPorEvento(evento.id);
  const uids = [...new Set(
    [evento.criadorId, ...vinculos.map((item) => item.usuarioId)].filter(Boolean),
  )];
  await cancelarLembreteEvento(evento.id, AVISO, evento.dataHoraAbertura);
  await Promise.all(
    uids.map((uid) =>
      cancelarLembreteEvento(evento.id, uid, evento.dataHoraAbertura),
    ),
  );
};

const reservarExcecao = async (evento: Evento): Promise<void> => {
  if (!evento.serieId || !evento.ocorrenciaYmd) {
    return;
  }
  const serie = await serieEventoRepository.buscarPorId(evento.serieId);
  if (!serie || serie.excecoes.includes(evento.ocorrenciaYmd)) {
    return;
  }
  if (serie.excecoes.length >= TETO_EXCECOES) {
    log.warn("Evento", "Exceções da série no teto; a data pode voltar", {
      serieId: serie.id,
      ymd: evento.ocorrenciaYmd,
    });
    return;
  }
  await serieEventoRepository.definirExcecoes(serie.id, [
    ...serie.excecoes,
    evento.ocorrenciaYmd,
  ]);
};

const varrerStories = async (
  campo: CampoStory,
  valor: string,
  tratar: (lote: StoryLocal[]) => Promise<void>,
): Promise<void> => {
  for (let rodada = 0; rodada < RODADAS_STORY; rodada += 1) {
    const lote = await storyLocalRepository.listarPorCampo(
      campo,
      valor,
      LOTE_STORY,
    );
    if (lote.length === 0) {
      return;
    }
    await tratar(lote);
    if (lote.length < LOTE_STORY) {
      return;
    }
  }
};

const apagarDocsStory = async (stories: StoryLocal[]): Promise<void> => {
  await Promise.all(
    stories.map((story) => apagarObjetoStory(story.storagePath)),
  );
  await Promise.all(
    stories.map((story) => storyLocalRepository.remover(story.id)),
  );
};

const apagarStoriesDoEvento = async (eventoId: string): Promise<void> => {
  await varrerStories("eventoId", eventoId, async (lote) => {
    const doAlbum = lote.filter((story) => story.album === "evento");
    const restantes = lote.filter((story) => story.album !== "evento");
    await apagarDocsStory(doAlbum);
    await storyLocalRepository.soltarEvento(
      restantes.map((story) => ({
        id: story.id,
        marcaTipo: story.marcaTipo,
        marcaId: story.marcaId,
      })),
      eventoId,
    );
  });
  await varrerStories("marcaId", eventoId, async (lote) => {
    await storyLocalRepository.soltarMarca(lote.map((story) => story.id));
  });
};

const apagarStoriesDoLocal = async (localId: string): Promise<void> => {
  await varrerStories("localId", localId, apagarDocsStory);
  await varrerStories("marcaId", localId, async (lote) => {
    await storyLocalRepository.soltarMarca(lote.map((story) => story.id));
  });
};

export const apagarEvento = async (id: string): Promise<ResultadoApagar> => {
  const evento = await eventoRepository.buscarPorId(id);
  if (!evento) {
    return "ausente";
  }
  await cancelarLembretesDoEvento(evento);
  await reservarExcecao(evento);
  await Promise.all([
    usuarioEventoRepository.removerPorEvento(id),
    usuarioEventoFeedbackRepository.removerPorEvento(id),
    conviteEventoRepository.removerPorEvento(id),
  ]);
  await apagarStoriesDoEvento(id);
  await eventoRepository.remover(id);
  log.info("Evento", "Evento removido", {
    eventoId: id,
    serieId: evento.serieId,
  });
  return "ok";
};

export const apagarLocal = async (id: string): Promise<ResultadoApagar> => {
  const local = await localRepository.buscarPorId(id);
  if (!local) {
    return "ausente";
  }
  await eventoRepository.desvincularLocal(id);
  await Promise.all([
    ofertaLocalRepository.removerPorLocal(id),
    usuarioOfertaCupomRepository.removerPorLocal(id),
    usuarioLocalFavoritoRepository.removerPorLocal(id),
    usuarioLocalFeedbackRepository.removerPorLocal(id),
    usuarioLocalCheckinRepository.removerPorLocal(id),
  ]);
  await apagarStoriesDoLocal(id);
  await localRepository.remover(id);
  log.info("Local", "Local removido", {localId: id});
  return "ok";
};
