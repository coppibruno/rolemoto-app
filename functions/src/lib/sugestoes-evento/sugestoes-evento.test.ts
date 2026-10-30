import {describe, expect, it} from "vitest";
import {
  ID_SUGESTAO_EVENTO_RE,
  encerramentoValido,
  idSugestaoEvento,
  instanteDoJsonLd,
  intervaloDoCartaz,
  paredeSaoPauloIso,
} from "./datas-evento";
import {escolherSugestoesEvento, type CandidatoEvento} from "./escolher-sugestoes-evento";
import {parsearAgendaMotoClub} from "./parsear-agenda-motoclub";
import {parsearDetalheMotoClub} from "./parsear-detalhe-motoclub";
import {pontuarSugestaoEvento} from "./pontuar-sugestao-evento";
import {acessoDaAgenda, tituloCurto} from "./texto-sugestao-evento";

const AGORA = new Date("2026-10-29T15:00:00.000Z");

const HTML = `
<div class="events-grid">
<div class="event-card event-variant-0 ">
<a href="/eventos/8-moto-encontro-rota-392-internacional-cerro-largo-3kwvbj15">
<span class="event-type" style="position:static">ENCONTRO</span>
<span class="event-date-stamp"><strong>30–01</strong><small>OUT</small></span>
<div class="event-card-overlay"><span>Cerro Largo, RS</span><strong>8º Moto Encontro Rota 392</strong></div>
</a>
<svg class="lucide lucide-clock"></svg>12:00
<p>Encontro com camping e motociclistas. Entrada R$ 10,00.</p>
<div style="background-image:url(&#x27;https://cdn.example/foto.jpg&#x27;)"></div>
</div>
<div class="event-card ">
<a href="/eventos/tributo-rock-bar-florianopolis-8abcde12">
<span class="event-type">ENCONTRO</span>
<span class="event-date-stamp"><strong>31</strong><small>OUT</small></span>
<div class="event-card-overlay"><span>Florianópolis, SC</span><strong>Tributo no rock bar</strong></div>
</a>
<p>Show de banda.</p>
</div>
<div class="event-card ">
<a href="/eventos/aniversario-da-anne-guiados-pelas-sombras-8zzzzzz1">
<span class="event-type">ANIVERSÁRIO</span>
<span class="event-date-stamp"><strong>02</strong><small>NOV</small></span>
<div class="event-card-overlay"><span>Joinville, SC</span><strong>Aniversário da Anne</strong></div>
</a>
<p>Churrasco na sede.</p>
</div>
<div class="event-card ">
<a href="/eventos/4-festival-da-pimenta-de-uru-motorock-8b0oyi5">
<span class="event-type">FESTIVAL</span>
<span class="event-date-stamp"><strong>30</strong><small>OUT</small></span>
<div class="event-card-overlay"><span>Uru, SP</span><strong>Festival Motorock</strong></div>
</a>
<p>Motociclistas e camping.</p>
</div>
</div>
`;

const candidato = (
  parcial: Partial<CandidatoEvento> & Pick<CandidatoEvento, "id" | "titulo" | "nota">,
): CandidatoEvento => ({
  slug: "8-moto-encontro-rota-392-internacional-cerro-largo-3kwvbj15",
  motivos: ["título tem moto"],
  tipoSugerido: "moto_point",
  inicioIso: "2026-10-30T15:00:00.000Z",
  fimIso: null,
  cidade: "Cerro Largo, RS",
  uf: "RS",
  texto: "",
  fotoUrl: "",
  hora: "12:00",
  ...parcial,
});

describe("intervaloDoCartaz", () => {
  it("lê o fim de semana no mês do cartaz", () => {
    const quando = intervaloDoCartaz("30–01", "OUT", "12:00", AGORA);
    expect(quando?.inicio).toBe(paredeSaoPauloIso(2026, 10, 30, 12, 0));
    expect(quando?.fim).toBe(paredeSaoPauloIso(2026, 11, 1, 12, 0));
  });

  it("não empurra um dia já passado deste mês para o ano que vem", () => {
    expect(intervaloDoCartaz("22", "OUT", "12:00", AGORA)).toBeNull();
  });

  it("janeiro listado em dezembro cai no ano seguinte", () => {
    const dezembro = new Date("2026-12-15T15:00:00.000Z");
    const quando = intervaloDoCartaz("10", "JAN", "12:00", dezembro);
    expect(quando?.inicio).toBe(paredeSaoPauloIso(2027, 1, 10, 12, 0));
  });
});

describe("instanteDoJsonLd", () => {
  it("trata o relógio com offset zero como horário de São Paulo", () => {
    expect(instanteDoJsonLd("2026-10-30T12:00:00+00:00", "09:00")).toBe(
      paredeSaoPauloIso(2026, 10, 30, 12, 0),
    );
  });

  it("data sem hora herda o relógio de abertura", () => {
    expect(instanteDoJsonLd("2026-11-01", "12:00")).toBe(
      paredeSaoPauloIso(2026, 11, 1, 12, 0),
    );
  });
});

describe("encerramentoValido", () => {
  it("limita a duração a 7 dias", () => {
    const inicio = paredeSaoPauloIso(2026, 10, 30, 12, 0);
    const fim = paredeSaoPauloIso(2026, 11, 20, 12, 0);
    const resultado = encerramentoValido(inicio, fim);
    expect(resultado.limitado).toBe(true);
    expect(Date.parse(resultado.iso ?? "") - Date.parse(inicio)).toBeLessThan(
      7 * 24 * 60 * 60 * 1000,
    );
  });
});

describe("pontuarSugestaoEvento", () => {
  it("aceita encontro de moto no Sul", () => {
    const nota = pontuarSugestaoEvento({
      titulo: "8º Moto Encontro Rota 392",
      texto: "Camping, motociclistas e café 0800",
      tipoLista: "ENCONTRO",
      uf: "RS",
    });
    expect(nota.entra).toBe(true);
    if (nota.entra) {
      expect(nota.nota).toBeGreaterThanOrEqual(50);
      expect(nota.tipoSugerido).toBe("moto_point");
    }
  });

  it("aceita sinal de moto no texto e recusa tributo", () => {
    const nota = pontuarSugestaoEvento({
      titulo: "Ovelhaço 2026",
      texto: "União e motociclismo",
      tipoLista: "FESTIVAL",
      uf: "RS",
    });
    expect(nota.entra).toBe(true);
    expect(pontuarSugestaoEvento({
      titulo: "21 Anos do Pterodactilos MC",
      texto: "Biker rock",
      tipoLista: "ANIVERSÁRIO",
      uf: "PR",
    }).entra).toBe(true);
    expect(pontuarSugestaoEvento({
      titulo: "Tributo a Black Sabbath",
      texto: "Local no motoclube",
      tipoLista: "FESTIVAL",
      uf: "SC",
    }).entra).toBe(false);
  });

  it("recusa show, aniversário pessoal, passeio e outro estado", () => {
    expect(pontuarSugestaoEvento({
      titulo: "Tributo no rock bar",
      texto: "Show",
      tipoLista: "ENCONTRO",
      uf: "SC",
    }).entra).toBe(false);
    expect(pontuarSugestaoEvento({
      titulo: "Aniversário da Anne",
      texto: "Churrasco",
      tipoLista: "ANIVERSÁRIO",
      uf: "SC",
    }).entra).toBe(false);
    expect(pontuarSugestaoEvento({
      titulo: "Passeio de moto na serra",
      texto: "Comboio",
      tipoLista: "PASSEIO",
      uf: "SC",
    }).entra).toBe(false);
    expect(pontuarSugestaoEvento({
      titulo: "Festival Motorock",
      texto: "Motociclistas",
      tipoLista: "FESTIVAL",
      uf: "SP",
    }).entra).toBe(false);
  });

  it("sugere track day e ingresso quando o texto pede", () => {
    const nota = pontuarSugestaoEvento({
      titulo: "Track day de moto em Tarumã",
      texto: "Autódromo",
      tipoLista: "ENCONTRO",
      uf: "RS",
    });
    expect(nota.entra && nota.tipoSugerido).toBe("track_day");
    expect(acessoDaAgenda("Entrada R$ 10,00", "https://motoclub.run/e").acesso)
      .toBe("ingresso");
    expect(acessoDaAgenda("Entrada gratuita", "https://motoclub.run/e").acesso)
      .toBe("gratis");
  });
});

describe("parsear agenda e detalhe", () => {
  it("lê os cards da grade", () => {
    const cards = parsearAgendaMotoClub(HTML);
    expect(cards).toHaveLength(4);
    expect(cards[0]).toMatchObject({
      uf: "RS",
      titulo: "8º Moto Encontro Rota 392",
      hora: "12:00",
      fotoUrl: "https://cdn.example/foto.jpg",
    });
    expect(cards[0].texto).toContain("R$ 10,00");
  });

  it("lê o JSON-LD do evento", () => {
    const html = `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Event",
      name: "8º Moto Encontro",
      startDate: "2026-10-30T12:00:00+00:00",
      endDate: "2026-11-01",
      location: {
        "@type": "Place",
        name: "Parque de Exposições",
        address: {
          streetAddress: "Parque de Exposições",
          addressLocality: "Cerro Largo",
          addressRegion: "RS",
        },
      },
      description: "Encontro de motos",
    })}</script>`;
    expect(parsearDetalheMotoClub(html)).toMatchObject({
      localNome: "Parque de Exposições",
      cidade: "Cerro Largo",
      uf: "RS",
      inicioBruto: "2026-10-30T12:00:00+00:00",
    });
  });
});

describe("escolherSugestoesEvento", () => {
  it("corta em 16, ignora id conhecido e evento parecido no mesmo dia", () => {
    const itens = Array.from({length: 18}, (_, indice) => candidato({
      id: `motoclub_slug-${indice}_2026-11-0${indice % 9}`,
      titulo: `Moto encontro ${indice}`,
      nota: 80 - indice,
      slug: `moto-encontro-numero-${indice}-abcdefgh`,
      inicioIso: `2026-11-${String((indice % 27) + 1).padStart(2, "0")}T15:00:00.000Z`,
    }));
    const repetido = itens[3];
    const escolhidos = escolherSugestoesEvento(
      itens,
      new Set([itens[0].id]),
      [{
        titulo: repetido.titulo,
        dataHoraAbertura: repetido.inicioIso,
        linkIngresso: null,
        informacoes: "",
      }],
    );
    expect(escolhidos).toHaveLength(16);
    expect(escolhidos.some((item) => item.id === itens[0].id)).toBe(false);
    expect(escolhidos.some((item) => item.id === repetido.id)).toBe(false);
    expect(escolhidos[0].nota).toBeGreaterThanOrEqual(escolhidos[1].nota);
  });
});

describe("idSugestaoEvento", () => {
  it("aceita o id que a homologação recebe", () => {
    const id = idSugestaoEvento(
      "8-moto-encontro-rota-392-internacional-cerro-largo-3kwvbj15",
      paredeSaoPauloIso(2026, 10, 30, 12, 0),
    );
    expect(id).toBe(
      "motoclub_8-moto-encontro-rota-392-internacional-cerro-largo-3kwvbj15_2026-10-30",
    );
    expect(ID_SUGESTAO_EVENTO_RE.test(id)).toBe(true);
  });
});

describe("tituloCurto", () => {
  it("corta título longo", () => {
    expect(tituloCurto("a".repeat(90))).toHaveLength(80);
  });
});
