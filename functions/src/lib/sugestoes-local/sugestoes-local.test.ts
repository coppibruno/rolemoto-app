import {describe, expect, it} from "vitest";
import {
  escolherSugestoes,
  type CandidatoComSemente,
} from "./escolher-sugestoes-local";
import {
  lerAceitos,
  modeloDaClassificacao,
  selecionarParaIa,
} from "./classificar-destino-moto";
import {consultasDaRodada, consultasDaSemente} from "./facetas-busca";
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
  it("aceita a serra no ponto turístico quando o nome é a rota", () => {
    const resultado = entrada({
      nome: "Serra do Rio do Rastro",
      distanciaKm: 4,
      faceta: "turismo",
    });
    expect(resultado.entra).toBe(true);
    if (!resultado.entra) {
      return;
    }
    expect(resultado.nota).toBeGreaterThanOrEqual(50);
    expect(resultado.categoriaSugerida).toBe("mirante");
    expect(resultado.motivos).toContain("casa com Serra do Rio do Rastro");
  });

  it("recusa mirante no ponto turístico mesmo quando cita a rota", () => {
    const resultado = entrada({
      nome: "Mirante do Rio do Rastro",
      distanciaKm: 2,
      faceta: "turismo",
      destinoMoto: true,
    });
    expect(resultado.entra).toBe(false);
  });

  it("aceita mirante só no filtro mirante", () => {
    const resultado = entrada({
      nome: "Mirante da Serra Dona Francisca",
      distanciaKm: 3,
      faceta: "mirante",
      sementeNome: "Serra Dona Francisca",
    });
    expect(resultado.entra).toBe(true);
    if (!resultado.entra) {
      return;
    }
    expect(resultado.categoriaSugerida).toBe("mirante");
    expect(resultado.motivos).toContain("busca de mirante");
  });

  it("recusa a serra no filtro mirante", () => {
    const resultado = entrada({
      nome: "Serra do Rio do Rastro",
      distanciaKm: 4,
      faceta: "mirante",
    });
    expect(resultado.entra).toBe(false);
  });

  it("recusa mirante genérico fora do filtro mirante", () => {
    const resultado = entrada({nome: "Mirante da Serra", distanciaKm: 4});
    expect(resultado.entra).toBe(false);
  });

  it("aceita destino de moto que a IA marcou no ponto turístico", () => {
    const resultado = entrada({
      nome: "Pedra Furada",
      distanciaKm: 4,
      faceta: "turismo",
      destinoMoto: true,
    });
    expect(resultado.entra).toBe(true);
    if (!resultado.entra) {
      return;
    }
    expect(resultado.motivos).toContain("ponto turístico de moto");
    expect(resultado.categoriaSugerida).toBe("mirante");
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
      candidato(indice, `Moto Point ${indice}`, `lugar${indice}`),
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
    const perto = candidato(1, "Moto Point da Serra", "lugarpublicado");
    const outro = candidato(2, "Moto Point Novo", "lugarnovo");
    const repetido = candidato(3, "Moto Point Repetido", "lugarvisto");
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
    const perto = candidato(0, "Moto Point da Serra", "lugarperto");
    perto.lat = semente.lat + 0.001;
    const longe = candidato(4, "Moto Point do Canyon", "lugarlonge");
    const escolhidos = escolherSugestoes({
      candidatos: [perto, longe],
      sugestoesIds: new Set(),
      locais: [
        {
          googlePlaceId: null,
          nome: "Moto Point da Serra",
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

  it("ponto turístico busca a serra; mirante busca a palavra mirante", () => {
    const turismo = consultasDaSemente(["turismo"], "Serra do Rio do Rastro", "SC");
    expect(turismo.map((item) => item.texto)).toEqual([
      "ponto de encontro de motos",
      "oficina de motos",
      "Serra do Rio do Rastro, SC",
    ]);
    expect(turismo[2]?.tipo).toBeUndefined();
    const mirante = consultasDaSemente(["mirante"], "Serra do Rio do Rastro", "SC");
    expect(mirante.map((item) => item.texto)).toContain("mirante");
    expect(mirante.map((item) => item.texto)).not.toContain("Serra do Rio do Rastro, SC");
  });
});

describe("classificar destino de moto", () => {
  it("manda para a IA só ponto turístico que ainda não é a serra nem mirante", () => {
    const selecionados = selecionarParaIa([
      {
        placeId: "rota",
        nome: "Serra do Rio do Rastro",
        resumo: "",
        sementeNome: "Serra do Rio do Rastro",
        faceta: "turismo",
      },
      {
        placeId: "mirante",
        nome: "Mirante da Serra Dona Francisca",
        resumo: "",
        sementeNome: "Serra Dona Francisca",
        faceta: "turismo",
      },
      {
        placeId: "filtro-mirante",
        nome: "Mirante da Serra",
        resumo: "",
        sementeNome: "Serra do Rio do Rastro",
        faceta: "mirante",
      },
      {
        placeId: "duvida",
        nome: "Pedra Furada",
        resumo: "",
        sementeNome: "Serra do Corvo Branco",
        faceta: "turismo",
      },
    ]);
    expect(selecionados.map((item) => item.placeId)).toEqual(["duvida"]);
  });

  it("usa o Flash-Lite e ignora modelo saturado", () => {
    expect(modeloDaClassificacao(undefined)).toBe("gemini-3.5-flash-lite");
    expect(modeloDaClassificacao("gemini-3.8-flash")).toBe(
      "gemini-3.5-flash-lite",
    );
    expect(modeloDaClassificacao("gemini-3.5-flash")).toBe(
      "gemini-3.5-flash-lite",
    );
    expect(modeloDaClassificacao("gemini-3.7-flash")).toBe(
      "gemini-3.5-flash-lite",
    );
  });

  it("só aceita ids que foram enviados", () => {
    const aceitos = lerAceitos(
      "{\"aceitos\":[\"abc\", \"inventado\"]}",
      new Set(["abc"]),
    );
    expect([...aceitos]).toEqual(["abc"]);
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
