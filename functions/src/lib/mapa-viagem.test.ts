import {describe, expect, it} from "vitest";
import {haversineKm} from "./geo";
import {
  BYTES_POR_TILE,
  MARGEM_CORREDOR_KM,
  MAX_PARADAS,
  cadeiaViagem,
  corredorDaViagem,
  distanciaCadeiaKm,
  distanciaViagemKm,
  estimarBytes,
  estimarTiles,
  hashPontosViagem,
  parseParadas,
  tilesDoCorredor,
} from "./mapa-viagem";

const ponto = (lat: number, lng: number, nome = "") => ({
  lat,
  lng,
  endereco: `Rua ${lat},${lng}`,
  nome,
});

const BLUMENAU = ponto(-26.9189, -49.0661);
const POMERODE = ponto(-26.7406, -49.1761);
const JARAGUA = ponto(-26.4851, -49.0713);
const JOINVILLE = ponto(-26.3045, -48.8487);

describe("parseParadas", () => {
  it("aceita de 0 a 8 paradas e recusa a nona", () => {
    expect(parseParadas(undefined)).toEqual({ok: true, paradas: []});
    expect(parseParadas([])).toEqual({ok: true, paradas: []});
    const oito = Array.from({length: MAX_PARADAS}, (_, i) => ponto(-27 + i * 0.01, -49));
    const ok = parseParadas(oito);
    expect(ok.ok && ok.paradas).toHaveLength(8);
    expect(parseParadas([...oito, ponto(-27.5, -49)])).toEqual({
      ok: false,
      erro: "No máximo 8 paradas",
    });
  });

  it("recusa ponto fora do Sul e item malformado", () => {
    expect(parseParadas([ponto(-23.55, -46.63)])).toEqual({
      ok: false,
      erro: "Localização deve estar em SC, PR ou RS",
    });
    expect(parseParadas([{lat: -27, lng: -49}])).toEqual({
      ok: false,
      erro: "parada inválida",
    });
    expect(parseParadas("x")).toEqual({ok: false, erro: "paradas inválidas"});
  });

  it("mantém a ordem recebida e limpa o endereço", () => {
    const r = parseParadas([
      {...POMERODE, endereco: "  Centro  ", nome: " Café "},
      JARAGUA,
    ]);
    expect(r.ok && r.paradas.map((p) => p.lat)).toEqual([POMERODE.lat, JARAGUA.lat]);
    expect(r.ok && r.paradas[0]).toMatchObject({endereco: "Centro", nome: "Café"});
  });
});

describe("distância da cadeia", () => {
  it("sem parada continua a de uma perna", () => {
    const umaPerna = Math.round(
      haversineKm(BLUMENAU.lat, BLUMENAU.lng, JOINVILLE.lat, JOINVILLE.lng),
    );
    expect(
      distanciaViagemKm({localSaida: BLUMENAU, paradas: [], destinoFinal: JOINVILLE}),
    ).toBe(umaPerna);
    expect(distanciaViagemKm({localSaida: BLUMENAU, destinoFinal: JOINVILLE})).toBe(umaPerna);
  });

  it("com duas paradas soma na ordem e arredonda uma vez", () => {
    const pernas = [
      haversineKm(BLUMENAU.lat, BLUMENAU.lng, POMERODE.lat, POMERODE.lng),
      haversineKm(POMERODE.lat, POMERODE.lng, JARAGUA.lat, JARAGUA.lng),
      haversineKm(JARAGUA.lat, JARAGUA.lng, JOINVILLE.lat, JOINVILLE.lng),
    ];
    const esperado = Math.round(pernas[0] + pernas[1] + pernas[2]);
    const atalho = distanciaCadeiaKm([BLUMENAU, JOINVILLE]);
    const total = distanciaViagemKm({
      localSaida: BLUMENAU,
      paradas: [POMERODE, JARAGUA],
      destinoFinal: JOINVILLE,
    });
    expect(total).toBe(esperado);
    expect(total).toBeGreaterThan(atalho);
  });

  it("a ordem das paradas muda a soma", () => {
    const ida = distanciaCadeiaKm(cadeiaViagem(BLUMENAU, [JARAGUA, POMERODE], JOINVILLE));
    const certa = distanciaCadeiaKm(cadeiaViagem(BLUMENAU, [POMERODE, JARAGUA], JOINVILLE));
    expect(ida).toBeGreaterThan(certa);
  });
});

describe("hashPontosViagem", () => {
  const base = cadeiaViagem(BLUMENAU, [POMERODE], JOINVILLE);

  it("muda quando uma coordenada muda", () => {
    const movido = cadeiaViagem(BLUMENAU, [{...POMERODE, lat: POMERODE.lat + 0.001}], JOINVILLE);
    expect(hashPontosViagem(movido)).not.toBe(hashPontosViagem(base));
  });

  it("não muda quando só o nome ou o endereço muda", () => {
    const renomeado = cadeiaViagem(
      BLUMENAU,
      [{...POMERODE, nome: "Parada do café", endereco: "Outro texto"}],
      JOINVILLE,
    );
    expect(hashPontosViagem(renomeado)).toBe(hashPontosViagem(base));
  });

  it("ignora ruído além da quinta casa e muda com a ordem", () => {
    const ruido = base.map((p) => ({...p, lat: p.lat + 0.000001}));
    expect(hashPontosViagem(ruido)).toBe(hashPontosViagem(base));
    expect(hashPontosViagem([...base].reverse())).not.toBe(hashPontosViagem(base));
    expect(hashPontosViagem(base)).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe("corredorDaViagem", () => {
  it("uma perna norte–sul cobre a margem de 20 km para cada lado", () => {
    const norte = {lat: -27.0, lng: -49.5};
    const sul = {lat: -28.0, lng: -49.5};
    const [r] = corredorDaViagem([norte, sul]);
    const kmNorte = haversineKm(norte.lat, norte.lng, r.latMax, norte.lng);
    const kmSul = haversineKm(sul.lat, sul.lng, r.latMin, sul.lng);
    const kmLeste = haversineKm(sul.lat, sul.lng, sul.lat, r.lngMax);
    const kmOeste = haversineKm(sul.lat, sul.lng, sul.lat, r.lngMin);
    for (const km of [kmNorte, kmSul, kmLeste, kmOeste]) {
      expect(km).toBeGreaterThanOrEqual(MARGEM_CORREDOR_KM - 0.1);
      expect(km).toBeLessThan(MARGEM_CORREDOR_KM + 1);
    }
  });

  it("devolve um retângulo por perna", () => {
    const pernas = corredorDaViagem(cadeiaViagem(BLUMENAU, [POMERODE, JARAGUA], JOINVILLE));
    expect(pernas).toHaveLength(3);
  });
});

describe("tiles do corredor", () => {
  it("conta zooms 9 a 14, sem repetir tile de pernas vizinhas", () => {
    const pontos = cadeiaViagem(BLUMENAU, [POMERODE], JOINVILLE);
    const pernas = corredorDaViagem(pontos);
    const tiles = tilesDoCorredor(pernas);
    const zooms = new Set(tiles.map((t) => t.z));
    expect([...zooms].sort((a, b) => a - b)).toEqual([9, 10, 11, 12, 13, 14]);
    const chaves = new Set(tiles.map((t) => `${t.z}/${t.x}/${t.y}`));
    expect(chaves.size).toBe(tiles.length);
    const soma = pernas.reduce((acc, r) => acc + estimarTiles([r]), 0);
    expect(estimarTiles(pernas)).toBeLessThan(soma);
    expect(estimarBytes(pernas)).toBe(estimarTiles(pernas) * BYTES_POR_TILE);
  });
});
