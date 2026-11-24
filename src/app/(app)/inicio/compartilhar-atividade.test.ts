import { afterEach, describe, expect, it, vi } from "vitest";
import type { ItemAtividade } from "@/types/atividade";
import {
  payloadCompartilharAtividade,
  urlDiretaAtividade,
} from "./compartilhar-atividade";

const ORIGEM = "https://www.rolemoto.com.br";

const item = (extra: Partial<ItemAtividade>): ItemAtividade => ({
  id: "a1",
  tipo: "foto",
  createdAt: "2026-11-15T15:00:00-03:00",
  autor: { uid: "ana", apelido: "Ana", fotoUrl: "" },
  outrosAutores: [],
  totalAutores: 1,
  podeCurtir: true,
  curtidoPorMim: false,
  totalCurtidas: 0,
  totalComentarios: 0,
  alvo: { tipo: "post", id: "p1", fotoUrl: "", legenda: "", marca: null },
  ...extra,
});

describe("urlDiretaAtividade / payloadCompartilharAtividade", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const stubWww = () => {
    vi.stubGlobal("window", {
      location: { hostname: "www.rolemoto.com.br", origin: ORIGEM },
    });
  };

  it("foto → link da imagem no perfil (estilo Instagram)", () => {
    stubWww();
    const card = item({
      tipo: "foto",
      alvo: {
        tipo: "post",
        id: "foto99",
        fotoUrl: "https://cdn/x.jpg",
        legenda: "No posto",
        marca: null,
      },
    });
    expect(urlDiretaAtividade(card)).toBe(`${ORIGEM}/perfil/ana/fotos/foto99`);
    const payload = payloadCompartilharAtividade(card);
    expect(payload?.url).toBe(`${ORIGEM}/perfil/ana/fotos/foto99`);
    expect(payload?.text).toContain(`${ORIGEM}/perfil/ana/fotos/foto99`);
  });

  it("telemetria → link do traçado", () => {
    stubWww();
    const card = item({
      tipo: "telemetria",
      alvo: {
        tipo: "telemetria",
        id: "t1",
        titulo: "Serra",
        distanciaKm: 40,
        tempoMovimentoSegundos: 3600,
        velocidadeMediaKmh: 80,
        inicioNome: "A",
        fimNome: "B",
        tracadoResumo: "",
        medalhas: [],
      },
    });
    expect(urlDiretaAtividade(card)).toBe(`${ORIGEM}/telemetria/t1`);
    expect(payloadCompartilharAtividade(card)?.url).toBe(`${ORIGEM}/telemetria/t1`);
  });

  it("rolê → convite público /r/", () => {
    stubWww();
    const card = item({
      tipo: "role_criado",
      alvo: {
        tipo: "role",
        id: "r1",
        titulo: "Serra",
        fotoCapaUrl: "",
        ritmo: "moderada",
        acesso: "aberto",
        dataHoraSaida: "2026-11-20T10:00:00-03:00",
        saidaNome: "Posto",
        destinoNome: "Mirante",
        confirmados: 2,
        jaSaiu: false,
        minhaParticipacao: "nenhuma",
      },
    });
    expect(urlDiretaAtividade(card)).toBe(`${ORIGEM}/r/r1`);
  });

  it("avaliação de local → /l/", () => {
    stubWww();
    const card = item({
      tipo: "avaliacao_local",
      alvo: {
        tipo: "avaliacao",
        alvoTipo: "local",
        alvoId: "loc1",
        alvoNome: "Posto Sol",
        nota: 5,
        comentario: "Top",
        fotosUrls: [],
        recomendaComboio: true,
      },
    });
    expect(urlDiretaAtividade(card)).toBe(`${ORIGEM}/l/loc1`);
    expect(payloadCompartilharAtividade(card)?.url).toBe(`${ORIGEM}/l/loc1`);
  });
});
