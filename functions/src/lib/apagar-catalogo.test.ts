import {beforeEach, describe, expect, it, vi} from "vitest";
import type {Evento} from "../types/evento";
import type {StoryLocal} from "../types/story-local";
import {apagarEvento, apagarLocal} from "./apagar-catalogo";
import {cancelarLembreteEvento} from "./lembretes";
import {log} from "./log";
import {TETO_EXCECOES} from "./serie-evento";
import {apagarObjetoStory} from "./story-local";

const db = vi.hoisted(() => ({
  eventoRepository: {
    buscarPorId: vi.fn(),
    remover: vi.fn(),
    desvincularLocal: vi.fn(),
  },
  localRepository: {
    buscarPorId: vi.fn(),
    remover: vi.fn(),
  },
  serieEventoRepository: {
    buscarPorId: vi.fn(),
    definirExcecoes: vi.fn(),
  },
  storyLocalRepository: {
    listarPorCampo: vi.fn(),
    soltarEvento: vi.fn(),
    soltarMarca: vi.fn(),
    remover: vi.fn(),
  },
  usuarioEventoRepository: {
    listarPorEvento: vi.fn(),
    removerPorEvento: vi.fn(),
  },
  usuarioEventoFeedbackRepository: {removerPorEvento: vi.fn()},
  conviteEventoRepository: {removerPorEvento: vi.fn()},
  ofertaLocalRepository: {removerPorLocal: vi.fn()},
  usuarioOfertaCupomRepository: {removerPorLocal: vi.fn()},
  usuarioLocalFavoritoRepository: {removerPorLocal: vi.fn()},
  usuarioLocalFeedbackRepository: {removerPorLocal: vi.fn()},
  usuarioLocalCheckinRepository: {removerPorLocal: vi.fn()},
}));

vi.mock("../repositories", () => db);

vi.mock("./lembretes", () => ({
  cancelarLembreteEvento: vi.fn(async () => undefined),
}));

vi.mock("./story-local", () => ({
  apagarObjetoStory: vi.fn(async () => undefined),
}));

vi.mock("./log", () => ({
  log: {info: vi.fn(), warn: vi.fn(), error: vi.fn()},
}));

const evento = (parcial: Partial<Evento> = {}): Evento => ({
  id: "e1",
  titulo: "Track",
  criadorId: "criador",
  dataHoraAbertura: "2026-11-20T18:00:00.000Z",
  serieId: null,
  ocorrenciaYmd: null,
  ...parcial,
} as Evento);

const story = (parcial: Partial<StoryLocal>): StoryLocal => ({
  id: "st1",
  album: "evento",
  storagePath: "stories/e1/foto.jpg",
  eventoId: "e1",
  marcaTipo: null,
  marcaId: null,
  ...parcial,
} as StoryLocal);

describe("apagar catálogo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.usuarioEventoRepository.listarPorEvento.mockResolvedValue([
      {usuarioId: "piloto"},
    ]);
    db.usuarioEventoRepository.removerPorEvento.mockResolvedValue(1);
    db.usuarioEventoFeedbackRepository.removerPorEvento.mockResolvedValue(0);
    db.conviteEventoRepository.removerPorEvento.mockResolvedValue(0);
    db.eventoRepository.remover.mockResolvedValue(undefined);
    db.eventoRepository.desvincularLocal.mockResolvedValue(0);
    db.localRepository.remover.mockResolvedValue(undefined);
    db.ofertaLocalRepository.removerPorLocal.mockResolvedValue(0);
    db.usuarioOfertaCupomRepository.removerPorLocal.mockResolvedValue(0);
    db.usuarioLocalFavoritoRepository.removerPorLocal.mockResolvedValue(0);
    db.usuarioLocalFeedbackRepository.removerPorLocal.mockResolvedValue(0);
    db.usuarioLocalCheckinRepository.removerPorLocal.mockResolvedValue(0);
    db.storyLocalRepository.listarPorCampo.mockReset();
    db.storyLocalRepository.listarPorCampo.mockResolvedValue([]);
    db.storyLocalRepository.soltarEvento.mockResolvedValue(undefined);
    db.storyLocalRepository.soltarMarca.mockResolvedValue(undefined);
    db.storyLocalRepository.remover.mockResolvedValue(undefined);
    db.serieEventoRepository.definirExcecoes.mockResolvedValue(null);
  });

  it("responde ausente quando o evento não existe", async () => {
    db.eventoRepository.buscarPorId.mockResolvedValue(null);
    await expect(apagarEvento("e1")).resolves.toBe("ausente");
    expect(db.eventoRepository.remover).not.toHaveBeenCalled();
  });

  it("apaga o evento avulso, os vínculos e a story do álbum", async () => {
    db.eventoRepository.buscarPorId.mockResolvedValue(evento());
    db.storyLocalRepository.listarPorCampo.mockImplementation(
      async (campo: string) => {
        if (campo !== "eventoId") return [];
        db.storyLocalRepository.listarPorCampo.mockResolvedValue([]);
        return [
          story({id: "do-evento", album: "evento"}),
          story({
            id: "do-local",
            album: "local",
            storagePath: "stories/locais/l1/foto.jpg",
            marcaTipo: "evento",
            marcaId: "e1",
          }),
        ];
      },
    );

    await expect(apagarEvento("e1")).resolves.toBe("ok");

    expect(cancelarLembreteEvento).toHaveBeenCalledWith(
      "e1",
      "todos",
      "2026-11-20T18:00:00.000Z",
    );
    expect(cancelarLembreteEvento).toHaveBeenCalledWith(
      "e1",
      "criador",
      "2026-11-20T18:00:00.000Z",
    );
    expect(cancelarLembreteEvento).toHaveBeenCalledWith(
      "e1",
      "piloto",
      "2026-11-20T18:00:00.000Z",
    );
    expect(db.usuarioEventoRepository.removerPorEvento).toHaveBeenCalledWith("e1");
    expect(db.usuarioEventoFeedbackRepository.removerPorEvento)
      .toHaveBeenCalledWith("e1");
    expect(db.conviteEventoRepository.removerPorEvento).toHaveBeenCalledWith("e1");
    expect(apagarObjetoStory).toHaveBeenCalledWith("stories/e1/foto.jpg");
    expect(db.storyLocalRepository.remover).toHaveBeenCalledWith("do-evento");
    expect(db.storyLocalRepository.soltarEvento).toHaveBeenCalledWith(
      [{id: "do-local", marcaTipo: "evento", marcaId: "e1"}],
      "e1",
    );
    expect(db.serieEventoRepository.definirExcecoes).not.toHaveBeenCalled();
    expect(db.eventoRepository.remover).toHaveBeenCalledWith("e1");
  });

  it("guarda a data da série para ela não voltar", async () => {
    db.eventoRepository.buscarPorId.mockResolvedValue(evento({
      serieId: "s1",
      ocorrenciaYmd: "2026-11-16",
    }));
    db.serieEventoRepository.buscarPorId.mockResolvedValue({
      id: "s1",
      excecoes: ["2026-11-09"],
    });

    await apagarEvento("e1");

    expect(db.serieEventoRepository.definirExcecoes).toHaveBeenCalledWith(
      "s1",
      ["2026-11-09", "2026-11-16"],
    );
  });

  it("apaga mesmo com a série no teto de exceções", async () => {
    db.eventoRepository.buscarPorId.mockResolvedValue(evento({
      serieId: "s1",
      ocorrenciaYmd: "2026-12-01",
    }));
    db.serieEventoRepository.buscarPorId.mockResolvedValue({
      id: "s1",
      excecoes: Array.from({length: TETO_EXCECOES}, (_, i) => `d${i}`),
    });

    await expect(apagarEvento("e1")).resolves.toBe("ok");

    expect(db.serieEventoRepository.definirExcecoes).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalled();
    expect(db.eventoRepository.remover).toHaveBeenCalledWith("e1");
  });

  it("responde ausente quando o local não existe", async () => {
    db.localRepository.buscarPorId.mockResolvedValue(null);
    await expect(apagarLocal("l1")).resolves.toBe("ausente");
    expect(db.eventoRepository.desvincularLocal).not.toHaveBeenCalled();
  });

  it("desvincula encontros e apaga o que é do ponto", async () => {
    db.localRepository.buscarPorId.mockResolvedValue({id: "l1", nome: "Posto"});
    db.storyLocalRepository.listarPorCampo.mockImplementation(
      async (campo: string) => {
        if (campo !== "localId") return [];
        db.storyLocalRepository.listarPorCampo.mockResolvedValue([]);
        return [story({
          id: "fachada",
          album: "local",
          storagePath: "stories/locais/l1/foto.jpg",
        })];
      },
    );

    await expect(apagarLocal("l1")).resolves.toBe("ok");

    expect(db.eventoRepository.desvincularLocal).toHaveBeenCalledWith("l1");
    expect(db.ofertaLocalRepository.removerPorLocal).toHaveBeenCalledWith("l1");
    expect(db.usuarioOfertaCupomRepository.removerPorLocal).toHaveBeenCalledWith("l1");
    expect(db.usuarioLocalFavoritoRepository.removerPorLocal).toHaveBeenCalledWith("l1");
    expect(db.usuarioLocalFeedbackRepository.removerPorLocal).toHaveBeenCalledWith("l1");
    expect(db.usuarioLocalCheckinRepository.removerPorLocal).toHaveBeenCalledWith("l1");
    expect(apagarObjetoStory).toHaveBeenCalledWith("stories/locais/l1/foto.jpg");
    expect(db.storyLocalRepository.remover).toHaveBeenCalledWith("fachada");
    expect(db.localRepository.remover).toHaveBeenCalledWith("l1");
  });
});
