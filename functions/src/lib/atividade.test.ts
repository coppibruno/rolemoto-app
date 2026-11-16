import {describe, expect, it} from "vitest";
import {
  aceitaComentario,
  agruparCompactos,
  idAtividade,
  lotesDeAutores,
  mesclarPaginas,
  resumirTracado,
  textoDoComentario,
} from "./atividade";
import {codificarPolyline, decodificarPolyline} from "./tracado";
import type {TipoAtividade} from "../types/atividade";

const HORA = 60 * 60 * 1000;
const base = Date.UTC(2026, 10, 15, 12);
const em = (horasAtras: number) => new Date(base - horasAtras * HORA).toISOString();

describe("FA1 — idAtividade", () => {
  it("monta os formatos de id", () => {
    expect(idAtividade("foto", ["p1"])).toBe("foto_p1");
    expect(idAtividade("telemetria", ["t1"])).toBe("telemetria_t1");
    expect(idAtividade("role_criado", ["r1"])).toBe("role_criado_r1");
    expect(idAtividade("role_realizado", ["r1"])).toBe("role_realizado_r1");
    expect(idAtividade("avaliacao_local", ["ana_l1"])).toBe("avaliacao_local_ana_l1");
    expect(idAtividade("avaliacao_evento", ["ana_e1"])).toBe("avaliacao_evento_ana_e1");
    expect(idAtividade("album_evento", ["e1"])).toBe("album_evento_e1");
    expect(idAtividade("entrada_role", ["ana", "r1"])).toBe("entrada_role_ana_r1");
    expect(idAtividade("inscricao_evento", ["ana", "e1"])).toBe("inscricao_evento_ana_e1");
    expect(idAtividade("selo", ["ana", "l1"])).toBe("selo_ana_l1");
  });

  it("recusa parte vazia, com barra ou sem partes", () => {
    expect(() => idAtividade("foto", [""])).toThrow();
    expect(() => idAtividade("selo", ["ana", "a/b"])).toThrow();
    expect(() => idAtividade("foto", [])).toThrow();
  });

  it("conteúdo com comentário; álbum e compactos sem", () => {
    const comComentario: TipoAtividade[] = [
      "foto", "telemetria", "role_criado", "role_realizado", "avaliacao_local", "avaliacao_evento",
    ];
    comComentario.forEach((tipo) => expect(aceitaComentario(tipo)).toBe(true));
    (["album_evento", "entrada_role", "inscricao_evento", "selo"] as TipoAtividade[])
      .forEach((tipo) => expect(aceitaComentario(tipo)).toBe(false));
  });

  it("textoDoComentario reusa as regras do post", () => {
    expect(textoDoComentario("  oi  ")).toEqual({ok: true, valor: "oi"});
    expect(textoDoComentario(" ")).toEqual({ok: false, erro: "escreva um comentário"});
  });
});

describe("FA1 — lotesDeAutores", () => {
  it("token primeiro, sem repetir, lotes de 30", () => {
    const seguidos = Array.from({length: 45}, (_, i) => `u${i}`);
    const lotes = lotesDeAutores("eu", ["u0", "eu", ...seguidos]);
    expect(lotes.map((l) => l.length)).toEqual([30, 16]);
    expect(lotes[0][0]).toBe("eu");
    expect(new Set(lotes.flat()).size).toBe(46);
  });

  it("corta em 300", () => {
    const seguidos = Array.from({length: 400}, (_, i) => `u${i}`);
    const lotes = lotesDeAutores("eu", seguidos);
    expect(lotes.flat()).toHaveLength(300);
    expect(lotes).toHaveLength(10);
  });

  it("sem seguidos devolve só o token", () => {
    expect(lotesDeAutores("eu", [])).toEqual([["eu"]]);
  });
});

describe("FA1 — mesclarPaginas", () => {
  it("ordena por createdAt desc, depois id desc, sem repetir e corta", () => {
    const a = [
      {id: "a1", createdAt: em(1)},
      {id: "a2", createdAt: em(3)},
    ];
    const b = [
      {id: "b1", createdAt: em(2)},
      {id: "b2", createdAt: em(3)},
      {id: "a1", createdAt: em(1)},
    ];
    expect(mesclarPaginas([a, b], 20)).toEqual({
      itens: [
        {id: "a1", createdAt: em(1)},
        {id: "b1", createdAt: em(2)},
        {id: "b2", createdAt: em(3)},
        {id: "a2", createdAt: em(3)},
      ],
      temMais: false,
    });
  });

  it("corta em 20 e avisa que sobrou", () => {
    const lista = Array.from({length: 25}, (_, i) => ({id: `x${i}`, createdAt: em(i)}));
    const {itens, temMais} = mesclarPaginas([lista.slice(0, 12), lista.slice(12)], 20);
    expect(itens).toHaveLength(20);
    expect(itens[19].id).toBe("x19");
    expect(temMais).toBe(true);
  });
});

describe("FA1 — agruparCompactos", () => {
  const item = (id: string, tipo: TipoAtividade, autorId: string, alvoId: string, horas: number) =>
    ({id, tipo, autorId, alvoId, createdAt: em(horas)});

  it("três inscrições em 24 h viram um grupo; a de 30 h fica separada", () => {
    const grupos = agruparCompactos([
      item("i1", "inscricao_evento", "ana", "e1", 0),
      item("f1", "foto", "ana", "p1", 1),
      item("i2", "inscricao_evento", "bruno", "e1", 2),
      item("i3", "inscricao_evento", "lia", "e1", 10),
      item("i4", "inscricao_evento", "caio", "e1", 30),
    ]);
    expect(grupos.map((g) => [g.principal.id, g.autores])).toEqual([
      ["i1", ["ana", "bruno", "lia"]],
      ["f1", ["ana"]],
      ["i4", ["caio"]],
    ]);
  });

  it("conteúdo nunca agrupa e selo fica individual", () => {
    const grupos = agruparCompactos([
      item("r1", "role_criado", "ana", "r1", 0),
      item("r2", "role_criado", "bruno", "r1", 1),
      item("s1", "selo", "ana", "l1", 0),
      item("s2", "selo", "bruno", "l1", 1),
    ]);
    expect(grupos).toHaveLength(4);
  });

  it("alvo diferente não agrupa", () => {
    const grupos = agruparCompactos([
      item("e1", "entrada_role", "ana", "r1", 0),
      item("e2", "entrada_role", "bruno", "r2", 1),
    ]);
    expect(grupos).toHaveLength(2);
  });
});

describe("FA1 — resumirTracado", () => {
  it("mantém primeiro e último e não passa de 120", () => {
    const pontos = Array.from({length: 1500}, (_, i) => ({lat: -25 + i * 0.001, lng: -49 + i * 0.0005}));
    const resumo = decodificarPolyline(resumirTracado(codificarPolyline(pontos)));
    expect(resumo.length).toBeLessThanOrEqual(120);
    expect(resumo[0]).toEqual(decodificarPolyline(codificarPolyline([pontos[0]]))[0]);
    const ultimo = decodificarPolyline(codificarPolyline(pontos)).at(-1);
    expect(resumo.at(-1)).toEqual(ultimo);
  });

  it("polyline vazia devolve vazio; curta fica igual", () => {
    expect(resumirTracado("")).toBe("");
    const curta = codificarPolyline([{lat: -25, lng: -49}, {lat: -25.1, lng: -49.1}]);
    expect(resumirTracado(curta)).toBe(curta);
  });
});
