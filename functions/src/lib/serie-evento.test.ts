import {describe, expect, it} from "vitest";
import {paredeSaoPauloIso} from "./sugestoes-evento/datas-evento";
import {
  calcularHorizonte,
  escolherUmaPorSerie,
  instantesOcorrencia,
  rotuloDiaSemana,
  type ItemSerieFeed,
} from "./serie-evento";

const instante = (ano: number, mes: number, dia: number, hora: number, minuto: number) =>
  new Date(paredeSaoPauloIso(ano, mes, dia, hora, minuto));

const regra = (agora: Date, excecoes: string[] = []) =>
  calcularHorizonte({
    diaSemana: 3,
    horaAbertura: "19:30",
    horaEncerramento: "23:00",
    aPartirDe: null,
    excecoes,
    agora,
  });

const item = (
  parcial: Partial<ItemSerieFeed> & Pick<ItemSerieFeed, "dataHoraAbertura">,
): ItemSerieFeed => ({
  serieId: null,
  cancelada: false,
  dataHoraEncerramento: null,
  ...parcial,
});

describe("calcularHorizonte", () => {
  it("inclui a quarta de hoje quando o encontro ainda não começou", () => {
    const datas = regra(instante(2026, 11, 4, 10, 0));
    expect(datas?.map((data) => data.ymd)).toEqual([
      "2026-11-04",
      "2026-11-11",
      "2026-11-18",
      "2026-11-25",
    ]);
    expect(datas?.[0].dataHoraAbertura).toBe(paredeSaoPauloIso(2026, 11, 4, 19, 30));
    expect(datas?.[0].dataHoraEncerramento).toBe(paredeSaoPauloIso(2026, 11, 4, 23, 0));
  });

  it("mantém a quarta de hoje enquanto o fim não passou", () => {
    const datas = regra(instante(2026, 11, 4, 22, 0));
    expect(datas?.[0].ymd).toBe("2026-11-04");
  });

  it("empurra para a outra quarta depois do fim", () => {
    const datas = regra(instante(2026, 11, 4, 23, 1));
    expect(datas?.[0].ymd).toBe("2026-11-11");
    expect(datas).toHaveLength(4);
  });

  it("na quinta aponta a quarta seguinte", () => {
    const datas = regra(instante(2026, 11, 5, 10, 0));
    expect(datas?.[0].ymd).toBe("2026-11-11");
  });

  it("não deixa a exceção consumir vaga do horizonte", () => {
    const datas = regra(instante(2026, 11, 4, 10, 0), ["2026-11-04"]);
    expect(datas?.map((data) => data.ymd)).toEqual([
      "2026-11-11",
      "2026-11-18",
      "2026-11-25",
      "2026-12-02",
    ]);
  });

  it("aceita fim na madrugada e recusa duração de 24 horas", () => {
    const noite = instantesOcorrencia("2026-11-04", "19:30", "01:00");
    expect(noite?.dataHoraEncerramento).toBe(paredeSaoPauloIso(2026, 11, 5, 1, 0));
    expect(instantesOcorrencia("2026-11-04", "19:30", "19:30")).toBeNull();
    expect(
      calcularHorizonte({
        diaSemana: 3,
        horaAbertura: "19:30",
        horaEncerramento: "19:30",
        aPartirDe: null,
        excecoes: [],
        agora: instante(2026, 11, 4, 10, 0),
      }),
    ).toBeNull();
  });
});

describe("escolherUmaPorSerie", () => {
  const agora = instante(2026, 11, 4, 20, 0);

  it("mantém o avulso, fica com a ao vivo e descarta a cancelada", () => {
    const avulso = item({
      dataHoraAbertura: paredeSaoPauloIso(2026, 11, 6, 9, 0),
      dataHoraEncerramento: paredeSaoPauloIso(2026, 11, 6, 18, 0),
    });
    const aoVivo = item({
      serieId: "velharia",
      dataHoraAbertura: paredeSaoPauloIso(2026, 11, 4, 19, 30),
      dataHoraEncerramento: paredeSaoPauloIso(2026, 11, 4, 23, 0),
    });
    const outra = item({
      serieId: "velharia",
      dataHoraAbertura: paredeSaoPauloIso(2026, 11, 11, 19, 30),
      dataHoraEncerramento: paredeSaoPauloIso(2026, 11, 11, 23, 0),
    });
    const cancelada = item({
      serieId: "velharia",
      cancelada: true,
      dataHoraAbertura: paredeSaoPauloIso(2026, 11, 4, 19, 30),
      dataHoraEncerramento: paredeSaoPauloIso(2026, 11, 4, 23, 0),
    });

    expect(escolherUmaPorSerie([cancelada, avulso, outra, aoVivo], agora)).toEqual([
      avulso,
      aoVivo,
    ]);
  });

  it("sem ao vivo fica a abertura menor", () => {
    const cedo = item({
      serieId: "velharia",
      dataHoraAbertura: paredeSaoPauloIso(2026, 11, 11, 19, 30),
      dataHoraEncerramento: paredeSaoPauloIso(2026, 11, 11, 23, 0),
    });
    const tarde = item({
      serieId: "velharia",
      dataHoraAbertura: paredeSaoPauloIso(2026, 11, 18, 19, 30),
      dataHoraEncerramento: paredeSaoPauloIso(2026, 11, 18, 23, 0),
    });
    expect(escolherUmaPorSerie([tarde, cedo], agora)).toEqual([cedo]);
  });

  it("entre duas ao vivo fica a abertura maior", () => {
    const cedo = item({
      serieId: "virada",
      dataHoraAbertura: paredeSaoPauloIso(2026, 11, 4, 18, 0),
      dataHoraEncerramento: paredeSaoPauloIso(2026, 11, 4, 23, 0),
    });
    const tarde = item({
      serieId: "virada",
      dataHoraAbertura: paredeSaoPauloIso(2026, 11, 4, 19, 30),
      dataHoraEncerramento: paredeSaoPauloIso(2026, 11, 4, 23, 30),
    });
    expect(escolherUmaPorSerie([cedo, tarde], agora)).toEqual([tarde]);
  });
});

describe("rotuloDiaSemana", () => {
  it("fecha a tabela da quarta e do domingo", () => {
    expect(rotuloDiaSemana(3)).toBe("toda quarta");
    expect(rotuloDiaSemana(0)).toBe("todo domingo");
    expect(rotuloDiaSemana(7)).toBeNull();
  });
});
