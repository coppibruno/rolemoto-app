import {describe, expect, it} from "vitest";
import {
  escolherSugestoes,
  type CandidatoComSemente,
} from "./escolher-sugestoes-local";
import {consultasDaRodada} from "./facetas-busca";
import {pontuarSugestaoLocal} from "./pontuar-sugestao-local";
import {SEMENTES_LOCAIS, fatiaSementes} from "./sementes";

const semente = SEMENTES_LOCAIS[0];

const entrada = (
  parcial: Partial<Parameters<typeof pontuarSugestaoLocal>[0]> & {nome: string},
) =>
  pontuarSugestaoLocal({
    tipos: ["tourist_attraction"],
    resumo: "",
    avaliacoes: [],
    distanciaKm: 4,
    raioKm: 12,
    dentroDoSul: true,
    sementeNome: semente.nome,
    ...parcial,
  });

const candidato = (
  indice: number,
  nome: string,
  placeId: string,
): CandidatoComSemente => ({
  placeId,
  nome,
  endereco: "Estrada da Serra, SC",
  lat: semente.lat + indice * 0.002,
  lng: semente.lng,
  tipos: ["tourist_attraction"],
  resumo: "",
  avaliacoes: [],
  linkMaps: "https://maps.example/lugar",
  aberto24h: true,
  horarios: [],
  horarioCompleto: true,
  fotoRecurso: "",
  fotoAtribuicao: "",
  semente,
  faceta: null,
});

describe("pontuarSugestaoLocal", () => {
  it("aceita mirante a 4 km da semente", () => {
    const resultado = entrada({nome: "Mirante da Serra", distanciaKm: 4});
    expect(resultado.entra).toBe(true);
    if (!resultado.entra) {
      return;
    }
    expect(resultado.nota).toBeGreaterThanOrEqual(50);
    expect(resultado.categoriaSugerida).toBe("mirante");
    expect(resultado.motivos.some((motivo) => motivo.includes("mirante"))).toBe(true);
  });

  it("recusa posto de bairro", () => {
    const resultado = entrada({
      nome: "Posto Ipiranga",
      tipos: ["gas_station"],
      distanciaKm: 1,
    });
    expect(resultado.entra).toBe(false);
  });

  it("recusa restaurante sem palavra de moto", () => {
    const resultado = entrada({
      nome: "Restaurante Bom Sabor",
      tipos: ["restaurant"],
      distanciaKm: 2,
    });
    expect(resultado.entra).toBe(false);
  });

  it("aceita restaurante com comboio na avaliação a 3 km", () => {
    const resultado = entrada({
      nome: "Restaurante Bom Sabor",
      tipos: ["restaurant"],
      distanciaKm: 3,
      avaliacoes: ["Parada boa para comboio"],
    });
    expect(resultado.entra).toBe(true);
    if (!resultado.entra) {
      return;
    }
    expect(resultado.motivos).toContain("avaliação cita comboio");
    expect(resultado.categoriaSugerida).toBe("restaurante_estrada");
  });

  it("aceita café pedido na busca", () => {
    const resultado = entrada({
      nome: "Café Colonial",
      tipos: ["cafe"],
      distanciaKm: 6,
      faceta: "cafe",
    });
    expect(resultado.entra).toBe(true);
    if (!resultado.entra) {
      return;
    }
    expect(resultado.categoriaSugerida).toBe("restaurante_estrada");
    expect(resultado.motivos).toContain("busca de café");
  });

  it("aceita padaria e cachoeira pedidas na busca", () => {
    const padaria = entrada({
      nome: "Padaria Central",
      tipos: ["bakery"],
      distanciaKm: 8,
      faceta: "padaria",
    });
    const cachoeira = entrada({
      nome: "Cachoeira do Avencal",
      tipos: ["tourist_attraction"],
      distanciaKm: 3,
      faceta: "natureza",
    });
    expect(padaria.entra).toBe(true);
    expect(cachoeira.entra).toBe(true);
    if (!padaria.entra || !cachoeira.entra) {
      return;
    }
    expect(padaria.categoriaSugerida).toBe("restaurante_estrada");
    expect(cachoeira.categoriaSugerida).toBe("mirante");
  });

  it("recusa ponto fora do raio da semente", () => {
    const resultado = entrada({nome: "Mirante da Serra", distanciaKm: 13, raioKm: 12});
    expect(resultado.entra).toBe(false);
  });
});

describe("escolherSugestoes", () => {
  it("grava no máximo 8 e fica com os mais perto", () => {
    const candidatos = Array.from({length: 10}, (_, indice) =>
      candidato(indice, `Mirante ${indice}`, `lugar${indice}`),
    );
    const escolhidos = escolherSugestoes({
      candidatos,
      sugestoesIds: new Set(),
      locais: [],
    });
    expect(escolhidos).toHaveLength(8);
    expect(escolhidos.map((item) => item.placeId)).not.toContain("lugar8");
    expect(escolhidos.map((item) => item.placeId)).not.toContain("lugar9");
  });

  it("ignora placeId já sugerido e local já publicado", () => {
    const perto = candidato(1, "Mirante da Serra", "lugarpublicado");
    const outro = candidato(2, "Mirante Novo", "lugarnovo");
    const repetido = candidato(3, "Mirante Repetido", "lugarvisto");
    const escolhidos = escolherSugestoes({
      candidatos: [perto, outro, repetido],
      sugestoesIds: new Set(["lugarvisto"]),
      locais: [
        {
          googlePlaceId: "lugarpublicado",
          nome: "Outro nome",
          lat: 0,
          lng: 0,
        },
      ],
    });
    expect(escolhidos.map((item) => item.placeId)).toEqual(["lugarnovo"]);
  });

  it("ignora nome parecido a menos de 150 m", () => {
    const perto = candidato(0, "Mirante da Serra", "lugarperto");
    perto.lat = semente.lat + 0.001;
    const longe = candidato(4, "Mirante do Canyon", "lugarlonge");
    const escolhidos = escolherSugestoes({
      candidatos: [perto, longe],
      sugestoesIds: new Set(),
      locais: [
        {
          googlePlaceId: null,
          nome: "Mirante da Serra",
          lat: semente.lat,
          lng: semente.lng,
        },
      ],
    });
    expect(escolhidos.map((item) => item.placeId)).toEqual(["lugarlonge"]);
  });
});

describe("consultasDaRodada", () => {
  it("mantém moto e oficina e omite o filtro desligado", () => {
    const textos = consultasDaRodada(["cafe", "padaria"]).map((item) => item.texto);
    expect(textos).toEqual([
      "ponto de encontro de motos",
      "oficina de motos",
      "padaria",
      "café",
    ]);
  });
});

describe("fatiaSementes", () => {
  it("avança quatro sementes e volta ao início", () => {
    const rodada = fatiaSementes(8, 4);
    expect(rodada.sementes.map((item) => item.id)).toEqual([
      "fortaleza",
      "rota-do-sol",
      "rio-do-rastro",
      "dona-francisca",
    ]);
    expect(rodada.proximoIndice).toBe(2);
  });
});
