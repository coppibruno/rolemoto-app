import {describe, expect, it} from "vitest";
import {
  DIAS_DISPENSA,
  MS_DIA,
  bonusDesempate,
  cortarRotulo,
  dispensaVigente,
  fraseDoRasto,
  hashEstavel,
  idDispensa,
  instanteDispensa,
  jitterDoDia,
  montarSugestoes,
  pontoDaFoto,
  pontoDaStory,
  telemetriaEhPublica,
} from "./sugestao-piloto";
import type {
  EventoResolvido,
  PerfilDesempate,
  PontoNome,
  RastoBruto,
} from "./sugestao-piloto";

const eu = (extra: Partial<PerfilDesempate> = {}): PerfilDesempate => ({
  pilotagem: "moderada",
  tipoMoto: "trail",
  cidade: "Blumenau",
  ...extra,
});

const perfil = (extra: Partial<PerfilDesempate> = {}): PerfilDesempate => ({
  pilotagem: "agressiva",
  tipoMoto: "speed",
  cidade: "Joinville",
  ...extra,
});

const vazio = {
  perfis: new Map<string, PerfilDesempate>(),
  euUid: "eu",
  eu: eu({pilotagem: null, tipoMoto: null, cidade: ""}),
  seguidos: new Set<string>(),
  dispensados: new Set<string>(),
  ymd: "2026-11-16",
};

const comPerfis = (
  uids: string[],
  extra: Partial<PerfilDesempate> = {},
): Map<string, PerfilDesempate> =>
  new Map(uids.map((uid) => [uid, perfil(extra)]));

describe("faixa, frase e jitter", () => {
  it("ordena segue você, organizador, segundo grau, telemetria e publicou", () => {
    const uids = ["pub", "tel", "seg", "org", "voce"];
    const rastros: RastoBruto[] = [
      {uid: "pub", tipo: "publicou", distanciaKm: 4, nome: "Mirante"},
      {uid: "tel", tipo: "telemetria", distanciaKm: 8, nome: "Posto"},
      {uid: "seg", tipo: "seguido_por", distanciaKm: null, apelidoIntermediario: "Ana"},
      {uid: "org", tipo: "organizou_role", distanciaKm: 12, titulo: "Serra"},
      {uid: "voce", tipo: "segue_voce", distanciaKm: null},
    ];
    const itens = montarSugestoes({
      ...vazio,
      rastros,
      perfis: comPerfis(uids),
    });
    expect(itens.map((item) => item.tipo)).toEqual([
      "segue_voce",
      "organizou_role",
      "seguido_por",
      "telemetria",
      "publicou",
    ]);
  });

  it("dois rastos na mesma pessoa deixam a faixa mais alta", () => {
    const itens = montarSugestoes({
      ...vazio,
      perfis: comPerfis(["p"]),
      rastros: [
        {uid: "p", tipo: "publicou", distanciaKm: 2, nome: "Bar"},
        {uid: "p", tipo: "organizou_role", distanciaKm: 9, titulo: "Serra"},
        {uid: "p", tipo: "telemetria", distanciaKm: 3, nome: "Posto"},
      ],
    });
    expect(itens).toHaveLength(1);
    expect(itens[0]?.tipo).toBe("organizou_role");
    expect(itens[0]?.texto).toBe("Organizou Serra · 9 km");
  });

  it("ritmo igual soma 30 e não ultrapassa a faixa de cima", () => {
    const perfis = new Map<string, PerfilDesempate>([
      ["baixo", perfil({pilotagem: "moderada"})],
      ["cima", perfil({pilotagem: "agressiva"})],
    ]);
    const itens = montarSugestoes({
      ...vazio,
      eu: eu({pilotagem: "moderada", tipoMoto: null, cidade: ""}),
      perfis,
      rastros: [
        {uid: "baixo", tipo: "publicou", distanciaKm: 1, nome: "A"},
        {uid: "cima", tipo: "telemetria", distanciaKm: 20, nome: "B"},
      ],
    });
    expect(itens.map((item) => item.uid)).toEqual(["cima", "baixo"]);
    expect(bonusDesempate(
      eu({pilotagem: "moderada", tipoMoto: null, cidade: ""}),
      perfil({pilotagem: "moderada"}),
    )).toBe(30);
  });

  it("cidade vazia não soma e tipo de moto nulo não soma", () => {
    const base = eu({pilotagem: "", tipoMoto: null, cidade: "   "});
    expect(bonusDesempate(base, perfil({cidade: "", tipoMoto: "trail"}))).toBe(0);
    expect(bonusDesempate(
      eu({pilotagem: "", tipoMoto: null, cidade: "Blumenau"}),
      perfil({pilotagem: "", tipoMoto: null, cidade: "blumenau"}),
    )).toBe(10);
    expect(bonusDesempate(
      eu({pilotagem: "", cidade: "", tipoMoto: "trail"}),
      perfil({pilotagem: "", cidade: "", tipoMoto: "trail"}),
    )).toBe(15);
  });

  it("o mesmo uid e ymd produzem o mesmo jitter; outro dia pode trocar a faixa por dentro", () => {
    expect(jitterDoDia("abc", "2026-11-16")).toBe(jitterDoDia("abc", "2026-11-16"));
    expect(hashEstavel("abc2026-11-16")).toBe(hashEstavel("abc2026-11-16"));
    const jitter = jitterDoDia("abc", "2026-11-16");
    expect(jitter).toBeGreaterThanOrEqual(-10);
    expect(jitter).toBeLessThanOrEqual(10);

    const rastros: RastoBruto[] = [
      {uid: "aaa", tipo: "publicou", distanciaKm: 5, nome: "A"},
      {uid: "bbb", tipo: "publicou", distanciaKm: 5, nome: "B"},
      {uid: "zzz", tipo: "telemetria", distanciaKm: 1, nome: "Z"},
    ];
    const ordem = (ymd: string) => montarSugestoes({
      ...vazio,
      ymd,
      perfis: comPerfis(["aaa", "bbb", "zzz"]),
      rastros,
    }).map((item) => item.uid);

    const primeira = ordem("2026-01-01");
    expect(primeira[0]).toBe("zzz");
    let trocou = false;
    for (let dia = 2; dia <= 400; dia += 1) {
      const mes = String(Math.floor((dia - 1) / 28) + 1).padStart(2, "0");
      const numero = String(((dia - 1) % 28) + 1).padStart(2, "0");
      const atual = ordem(`2026-${mes}-${numero}`);
      expect(atual[0]).toBe("zzz");
      if (atual.slice(1).join() !== primeira.slice(1).join()) {
        trocou = true;
        break;
      }
    }
    expect(trocou).toBe(true);
  });

  it("corta título e telemetria entra sem texto no card", () => {
    const titulo = "a".repeat(41);
    expect(cortarRotulo(titulo)).toBe(`${"a".repeat(39)}…`);
    expect(fraseDoRasto({
      uid: "u",
      tipo: "organizou_role",
      titulo,
      distanciaKm: 0,
    })).toBe(`Organizou ${"a".repeat(39)}… · 0 km`);
    expect(fraseDoRasto({
      uid: "u",
      tipo: "telemetria",
      nome: "Posto",
      distanciaKm: 12,
    })).toBe("");
    expect(fraseDoRasto({
      uid: "u",
      tipo: "telemetria",
      nome: "Blumenau, SC",
      distanciaKm: 8,
    })).toBe("");
  });

  it("story sem ponto não entra", () => {
    const locais = new Map<string, PontoNome>();
    const eventos = new Map<string, EventoResolvido>();
    expect(pontoDaStory({
      album: "perfil",
      localId: null,
      eventoId: null,
      localizacaoNome: null,
      localizacaoLat: null,
      localizacaoLng: null,
    }, locais, eventos)).toBeNull();
    expect(pontoDaFoto({
      marcaTipo: null,
      marcaId: null,
    }, locais, eventos)).toBeNull();
    expect(pontoDaStory({
      album: "local",
      localId: "l1",
      eventoId: null,
      localizacaoNome: null,
      localizacaoLat: null,
      localizacaoLng: null,
    }, new Map([["l1", {nome: "  ", lat: 1, lng: 2}]]), eventos)).toBeNull();
    expect(pontoDaStory({
      album: "local",
      localId: "l1",
      eventoId: null,
      localizacaoNome: null,
      localizacaoLat: null,
      localizacaoLng: null,
    }, new Map([["l1", {nome: "Bar", lat: 1, lng: 2}]]), eventos)).toEqual({
      nome: "Bar",
      lat: 1,
      lng: 2,
    });
  });

  it("dispensa dura 30 dias e o id é o par", () => {
    const agora = new Date("2026-11-16T15:00:00.000Z");
    expect(instanteDispensa(agora).getTime() - agora.getTime())
      .toBe(DIAS_DISPENSA * MS_DIA);
    expect(idDispensa("eu", "alvo")).toBe("eu_alvo");
    expect(dispensaVigente(instanteDispensa(agora), agora)).toBe(true);
    expect(dispensaVigente(new Date(agora.getTime() - MS_DIA), agora)).toBe(false);
    expect(telemetriaEhPublica(undefined)).toBe(true);
    expect(telemetriaEhPublica(false)).toBe(false);
  });

  it("eu, quem eu sigo e quem está dispensado ficam de fora", () => {
    const itens = montarSugestoes({
      ...vazio,
      perfis: comPerfis(["eu", "amigo", "sumido", "novo"]),
      seguidos: new Set(["amigo"]),
      dispensados: new Set(["sumido"]),
      rastros: [
        {uid: "eu", tipo: "segue_voce", distanciaKm: null},
        {uid: "amigo", tipo: "publicou", distanciaKm: 1, nome: "A"},
        {uid: "sumido", tipo: "segue_voce", distanciaKm: null},
        {uid: "novo", tipo: "publicou", distanciaKm: 2, nome: "B"},
      ],
    });
    expect(itens.map((item) => item.uid)).toEqual(["novo"]);
  });

  it("no segundo grau o nome é o do vínculo mais recente", () => {
    const itens = montarSugestoes({
      ...vazio,
      perfis: comPerfis(["carol"]),
      rastros: [
        {
          uid: "carol",
          tipo: "seguido_por",
          distanciaKm: null,
          apelidoIntermediario: "Bia",
          recencia: 1,
        },
        {
          uid: "carol",
          tipo: "seguido_por",
          distanciaKm: null,
          apelidoIntermediario: "Ana",
          recencia: 2,
        },
      ],
    });
    expect(itens[0]?.texto).toBe("Seguido por Ana");
  });
});
