import { describe, expect, it } from "vitest";
import type { AlvoRole, ItemAtividade } from "@/types/atividade";
import {
  ctaDoItem,
  hrefAlvo,
  nomesDoGrupo,
  rotuloNovidades,
  tempoRelativo,
  verboLinha,
} from "./atividade-texto";

const agora = new Date("2026-11-15T15:00:00-03:00");
const atras = (ms: number) => new Date(agora.getTime() - ms).toISOString();
const MIN = 60 * 1000;
const HORA = 60 * MIN;

const role = (extra: Partial<AlvoRole> = {}): AlvoRole => ({
  tipo: "role",
  id: "r1",
  titulo: "Serra",
  fotoCapaUrl: "",
  ritmo: "moderada",
  acesso: "aberto",
  dataHoraSaida: agora.toISOString(),
  saidaNome: "Posto",
  destinoNome: "Mirante",
  confirmados: 2,
  jaSaiu: false,
  minhaParticipacao: "nenhuma",
  ...extra,
});

const item = (extra: Partial<ItemAtividade>): ItemAtividade => ({
  id: "a1",
  tipo: "role_criado",
  createdAt: agora.toISOString(),
  autor: { uid: "ana", apelido: "Ana", fotoUrl: "" },
  outrosAutores: [],
  totalAutores: 1,
  podeCurtir: true,
  curtidoPorMim: false,
  totalCurtidas: 0,
  totalComentarios: 0,
  alvo: role(),
  ...extra,
});

describe("tempoRelativo", () => {
  it("minutos, horas, ontem, dias e data curta", () => {
    expect(tempoRelativo(atras(10 * 1000), agora)).toBe("agora");
    expect(tempoRelativo(atras(12 * MIN), agora)).toBe("há 12 min");
    expect(tempoRelativo(atras(3 * HORA), agora)).toBe("há 3 h");
    expect(tempoRelativo(atras(20 * HORA), agora)).toBe("ontem");
    expect(tempoRelativo(atras(4 * 24 * HORA), agora)).toBe("há 4 dias");
    expect(tempoRelativo(atras(10 * 24 * HORA), agora)).toBe("5 de nov");
  });
});

describe("rotuloNovidades", () => {
  it("singular, plural e teto", () => {
    expect(rotuloNovidades(1)).toBe("1 novidade");
    expect(rotuloNovidades(5)).toBe("5 novidades");
    expect(rotuloNovidades(20)).toBe("20+ novidades");
  });
});

describe("ctaDoItem", () => {
  it("Quero ir some quando já saiu ou o token já está no rolê", () => {
    expect(ctaDoItem(item({}))).toEqual({ rotulo: "Quero ir", href: "/roles/r1" });
    expect(ctaDoItem(item({ alvo: role({ jaSaiu: true }) }))).toBeNull();
    expect(ctaDoItem(item({ alvo: role({ minhaParticipacao: "pendente" }) }))).toBeNull();
  });

  it("telemetria e realizado sempre têm CTA; foto não", () => {
    expect(ctaDoItem(item({ tipo: "role_realizado" }))?.rotulo).toBe("Ver rolê");
    expect(
      ctaDoItem(
        item({
          tipo: "foto",
          alvo: { tipo: "post", id: "p1", fotoUrl: "", legenda: "", marca: null },
        }),
      ),
    ).toBeNull();
  });

  it("Eu também vou só em evento futuro sem inscrição", () => {
    const evento = {
      tipo: "evento" as const,
      id: "e1",
      titulo: "Café",
      fotoCapaUrl: "",
      dataHoraAbertura: agora.toISOString(),
      localNome: "",
      encerrado: false,
      inscrito: false,
    };
    expect(ctaDoItem(item({ tipo: "inscricao_evento", alvo: evento }))).toEqual({
      rotulo: "Eu também vou",
      href: "/eventos/e1",
    });
    expect(ctaDoItem(item({ tipo: "inscricao_evento", alvo: { ...evento, inscrito: true } })))
      .toBeNull();
  });
});

describe("linha agrupada", () => {
  it("nomes com e mais N e verbo no plural", () => {
    const grupo = item({
      tipo: "entrada_role",
      outrosAutores: [{ uid: "bruno", apelido: "Bruno", fotoUrl: "" }],
      totalAutores: 4,
    });
    expect(nomesDoGrupo(grupo)).toEqual({ nomes: "Ana, Bruno", extra: " e mais 2" });
    expect(verboLinha(grupo)).toBe("vão no rolê");
    expect(verboLinha(item({ tipo: "entrada_role" }))).toBe("vai no rolê");
  });

  it("post abre a foto do autor", () => {
    expect(
      hrefAlvo(
        item({ tipo: "foto", alvo: { tipo: "post", id: "p1", fotoUrl: "", legenda: "", marca: null } }),
      ),
    ).toBe("/perfil/ana/fotos/p1");
  });
});
