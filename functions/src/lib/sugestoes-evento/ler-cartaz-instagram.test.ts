import {describe, expect, it} from "vitest";
import {resolverLinkAprovacao, resolverLocalAprovacao} from "./aprovar-sugestao-evento";
import {ID_SUGESTAO_EVENTO_RE} from "./datas-evento";
import {HASHTAGS_INSTAGRAM, TETO_HASHTAGS_INSTAGRAM} from "./hashtags-instagram";
import {lerCartazInstagram} from "./ler-cartaz-instagram";
import type {FonteSugestaoEvento, LocalSugestaoEvento} from "../../types/sugestao-evento";

const AGORA = new Date("2026-11-05T15:00:00.000Z");

const cartaz = {
  eEvento: true,
  titulo: "Track Day em Cascavel",
  abertura: "2026-12-01T10:00:00-03:00",
  encerramento: null,
  tipo: "track_day",
  acesso: "gratis",
  linkIngresso: null,
  lugar: "Autódromo de Cascavel",
  cidade: "Cascavel",
  motivos: ["Cartaz do track day com a data de dezembro"],
};

describe("lerCartazInstagram", () => {
  it("aceita o JSON de um encontro futuro", () => {
    const lido = lerCartazInstagram(JSON.stringify(cartaz), {
      agora: AGORA,
      legenda: "Track day no autódromo",
    });
    expect(lido).toMatchObject({
      titulo: "Track Day em Cascavel",
      tipo: "track_day",
      acesso: "gratis",
      linkIngresso: null,
      lugar: "Autódromo de Cascavel",
      cidade: "Cascavel",
      nota: 50,
    });
    expect(Date.parse(lido?.abertura ?? "")).toBeGreaterThan(AGORA.getTime());
  });

  it("descarta quando não é evento, a data passou ou o título vem vazio", () => {
    const legenda = "foto da moto";
    expect(lerCartazInstagram({...cartaz, eEvento: false}, {agora: AGORA, legenda})).toBeNull();
    expect(lerCartazInstagram({...cartaz, titulo: "  "}, {agora: AGORA, legenda})).toBeNull();
    expect(lerCartazInstagram(
      {...cartaz, abertura: "2026-11-01T10:00:00-03:00"},
      {agora: AGORA, legenda},
    )).toBeNull();
  });

  it("descarta evento de outro estado e guarda a UF do Sul", () => {
    const legenda = "encontro";
    expect(lerCartazInstagram(
      {...cartaz, cidade: "Abaeté", uf: "MG"},
      {agora: AGORA, legenda},
    )).toBeNull();
    expect(lerCartazInstagram({...cartaz, uf: "pr"}, {agora: AGORA, legenda})?.uf).toBe("PR");
    expect(lerCartazInstagram({...cartaz, uf: ""}, {agora: AGORA, legenda})?.uf).toBe("");
  });

  it("corta o encerramento em 7 dias e registra o motivo", () => {
    const lido = lerCartazInstagram({
      ...cartaz,
      encerramento: "2026-12-20T10:00:00-03:00",
    }, {agora: AGORA, legenda: "encontro"});
    expect(lido?.motivos).toContain("encerramento limitado a 7 dias");
    const inicio = Date.parse(lido?.abertura ?? "");
    const fim = Date.parse(lido?.encerramento ?? "");
    expect(fim - inicio).toBeLessThan(7 * 24 * 60 * 60 * 1000);
    expect(fim).toBeGreaterThan(inicio);
  });

  it("só copia URL http que está na legenda", () => {
    const lido = lerCartazInstagram({
      ...cartaz,
      acesso: "ingresso",
      linkIngresso: "https://ingressos.example/fora",
    }, {
      agora: AGORA,
      legenda: "Ingresso em https://sympla.com.br/track e https://www.instagram.com/p/abc",
    });
    expect(lido?.acesso).toBe("ingresso");
    expect(lido?.linkIngresso).toBe("https://sympla.com.br/track");
  });

  it("deixa o ingresso vazio quando a legenda só diz link na bio", () => {
    const lido = lerCartazInstagram({
      ...cartaz,
      acesso: "ingresso",
      linkIngresso: "https://instagram.com/p/abc",
    }, {agora: AGORA, legenda: "Link na bio"});
    expect(lido?.linkIngresso).toBeNull();
  });
});

describe("hashtags do Instagram", () => {
  it("cabe na cota e não leva # nem acento", () => {
    expect([...HASHTAGS_INSTAGRAM]).toEqual([
      "encontromotos",
      "encontrodeMotos",
      "trackday",
      "trackdaybrasil",
      "motoclube",
      "cafecommotos",
      "roledeMoto",
      "diadomotociclista",
    ]);
    expect(HASHTAGS_INSTAGRAM.length).toBeLessThanOrEqual(TETO_HASHTAGS_INSTAGRAM);
    for (const tag of HASHTAGS_INSTAGRAM) {
      const semAcento = tag.normalize("NFD").replace(/\p{M}/gu, "");
      expect(tag).toBe(semAcento);
      expect(tag.includes("#")).toBe(false);
    }
  });

  it("aceita o id do post na homologação", () => {
    expect(ID_SUGESTAO_EVENTO_RE.test("ig_17895695668004550")).toBe(true);
    expect(ID_SUGESTAO_EVENTO_RE.test("ig_abc")).toBe(false);
  });
});

const pinSul: LocalSugestaoEvento = {
  lat: -27.59,
  lng: -48.55,
  endereco: "Rua das Motos, 10, Florianópolis",
  nome: "Moto point",
};

const sugestao = (
  fonte: FonteSugestaoEvento,
  local: LocalSugestaoEvento,
  linkIngresso: string | null,
) => ({
  fonte,
  local,
  linkIngresso,
  urlOrigem: "https://www.instagram.com/p/abc",
});

describe("resolverLocalAprovacao", () => {
  it("moto club usa o pin gravado e ignora outro ponto no corpo", () => {
    const origem = sugestao("motoclub", pinSul, null);
    const corpo = {local: {lat: -23.5, lng: -46.6, endereco: "São Paulo", nome: "SP"}};
    expect(resolverLocalAprovacao(origem, corpo)).toMatchObject({
      ok: true,
      local: {lat: -27.59, lng: -48.55},
    });
  });

  it("instagram sem pin exige um ponto no Sul", () => {
    const origem = sugestao("instagram", {
      lat: null,
      lng: null,
      endereco: "Autódromo",
      nome: "Autódromo",
    }, null);
    expect(resolverLocalAprovacao(origem, {}).ok).toBe(false);
    const fora = resolverLocalAprovacao(origem, {
      local: {lat: -23.55, lng: -46.63, endereco: "São Paulo, SP", nome: "SP"},
    });
    expect(fora).toMatchObject({ok: false});
    const dentro = resolverLocalAprovacao(origem, {
      local: {lat: -27.59, lng: -48.55, endereco: "Florianópolis, SC", nome: "Pista"},
    });
    expect(dentro).toMatchObject({
      ok: true,
      local: {lat: -27.59, lng: -48.55, nome: "Pista"},
    });
  });
});

describe("resolverLinkAprovacao", () => {
  it("moto club com ingresso usa o link ou a url de origem", () => {
    const origem = sugestao("motoclub", pinSul, null);
    expect(resolverLinkAprovacao(origem, "ingresso", {})).toMatchObject({
      ok: true,
      linkIngresso: origem.urlOrigem,
    });
  });

  it("instagram com ingresso não usa a url do post", () => {
    const origem = sugestao("instagram", pinSul, null);
    expect(resolverLinkAprovacao(origem, "ingresso", {})).toMatchObject({
      ok: false,
      erro: "linkIngresso é obrigatório",
    });
    expect(resolverLinkAprovacao(origem, "ingresso", {
      linkIngresso: "https://sympla.com.br/track",
    })).toMatchObject({
      ok: true,
      linkIngresso: "https://sympla.com.br/track",
    });
  });

  it("instagram grátis não pede link", () => {
    const origem = sugestao("instagram", pinSul, null);
    expect(resolverLinkAprovacao(origem, "gratis", {})).toEqual({
      ok: true,
      linkIngresso: null,
    });
  });
});
