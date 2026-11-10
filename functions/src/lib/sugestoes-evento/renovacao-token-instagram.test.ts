import {describe, expect, it, vi} from "vitest";
import {InstagramBloqueadoError, InstagramRedeError} from "./erros";
import {
  decidirRenovacao,
  estendeuPrazo,
  inspecaoDe,
  MARGEM_RENOVACAO_MS,
  resolverTokenInstagram,
  semSegredo,
  tokenTrocadoDe,
  type ClienteTokenInstagram,
  type TokenInstagramGuardado,
} from "./renovacao-token-instagram";

const AGORA = Date.parse("2026-11-09T20:00:00.000Z");
const DIA = 24 * 60 * 60 * 1000;
const SEMENTE = "EAASementeCurtaDoPainel123456";
const LONGO = "EAATokenLongoGuardado1234567890";
const NOVO = "EAATokenNovoRenovado12345678901";

const daqui = (ms: number) => AGORA + ms;

const clienteDe = (
  prazos: Record<string, number | null>,
  renovar: ClienteTokenInstagram["renovar"],
): ClienteTokenInstagram => ({
  inspecionar: vi.fn(async (token: string) => {
    if (!(token in prazos)) {
      return {valido: false, expiresAtMs: null};
    }
    return {valido: true, expiresAtMs: prazos[token]};
  }),
  renovar,
});

describe("decidirRenovacao", () => {
  it("usa o token folgado e renova na margem", () => {
    expect(decidirRenovacao({
      valido: true,
      expiresAtMs: daqui(MARGEM_RENOVACAO_MS + DIA),
    }, AGORA)).toBe("usar");
    expect(decidirRenovacao({
      valido: true,
      expiresAtMs: daqui(MARGEM_RENOVACAO_MS),
    }, AGORA)).toBe("renovar");
    expect(decidirRenovacao({
      valido: true,
      expiresAtMs: daqui(60 * 60 * 1000),
    }, AGORA)).toBe("renovar");
  });

  it("não renova token sem prazo e recusa o vencido", () => {
    expect(decidirRenovacao({valido: true, expiresAtMs: null}, AGORA)).toBe("usar");
    expect(decidirRenovacao({valido: false, expiresAtMs: null}, AGORA)).toBe("expirado");
    expect(decidirRenovacao({
      valido: true,
      expiresAtMs: AGORA - 1000,
    }, AGORA)).toBe("expirado");
  });
});

describe("leitura da Meta", () => {
  it("lê o debug e a troca", () => {
    expect(inspecaoDe({
      data: {is_valid: true, expires_at: 1_700_000_000},
    })).toEqual({valido: true, expiresAtMs: 1_700_000_000_000});
    expect(inspecaoDe({data: {is_valid: true, expires_at: 0}})).toEqual({
      valido: true,
      expiresAtMs: null,
    });
    expect(inspecaoDe({
      data: {is_valid: false, error: {message: "Session has expired"}},
    })).toEqual({valido: false, expiresAtMs: null});
    expect(tokenTrocadoDe({
      access_token: NOVO,
      expires_in: 5_183_944,
    }, AGORA)).toEqual({
      accessToken: NOVO,
      expiresAtMs: AGORA + 5_183_944 * 1000,
    });
  });

  it("esconde o token na mensagem", () => {
    const texto = semSegredo(`falhou EAAAbc123 access_token=${SEMENTE}`);
    expect(texto).not.toContain(SEMENTE);
    expect(texto).toContain("[token]");
  });

  it("só conta extensão de pelo menos um dia", () => {
    expect(estendeuPrazo(daqui(10 * DIA), daqui(50 * DIA), AGORA)).toBe(true);
    expect(estendeuPrazo(daqui(10 * DIA), daqui(10 * DIA), AGORA)).toBe(false);
  });
});

describe("resolverTokenInstagram", () => {
  const salvar = vi.fn(async (_token: TokenInstagramGuardado) => undefined);

  const entrada = (
    parcial: Partial<Parameters<typeof resolverTokenInstagram>[0]>,
  ) => ({
    envToken: SEMENTE,
    guardado: null as TokenInstagramGuardado | null,
    agora: AGORA,
    cliente: null as ClienteTokenInstagram | null,
    salvar,
    ...parcial,
  });

  it("sem credenciais devolve a semente e não chama a Meta", async () => {
    salvar.mockClear();
    const resultado = await resolverTokenInstagram(entrada({}));
    expect(resultado).toMatchObject({
      accessToken: SEMENTE,
      aviso: "sem-credenciais",
      renovou: false,
    });
    expect(salvar).not.toHaveBeenCalled();
  });

  it("grava a semente folgada e não troca", async () => {
    salvar.mockClear();
    const cliente = clienteDe({[SEMENTE]: daqui(40 * DIA)}, vi.fn());
    const resultado = await resolverTokenInstagram(entrada({cliente}));
    expect(resultado.accessToken).toBe(SEMENTE);
    expect(resultado.renovou).toBe(false);
    expect(salvar).toHaveBeenCalledWith({
      accessToken: SEMENTE,
      expiresAtMs: daqui(40 * DIA),
      semente: SEMENTE,
    });
    expect(cliente.renovar).not.toHaveBeenCalled();
  });

  it("troca a semente curta e fica com o token novo", async () => {
    salvar.mockClear();
    const renovar = vi.fn(async () => ({
      accessToken: NOVO,
      expiresAtMs: daqui(60 * DIA),
    }));
    const cliente = clienteDe({[SEMENTE]: daqui(60 * 60 * 1000)}, renovar);
    const resultado = await resolverTokenInstagram(entrada({cliente}));
    expect(resultado).toMatchObject({accessToken: NOVO, renovou: true});
    expect(salvar).toHaveBeenCalledWith({
      accessToken: NOVO,
      expiresAtMs: daqui(60 * DIA),
      semente: SEMENTE,
    });
  });

  it("com a mesma semente usa a cópia que vence depois", async () => {
    salvar.mockClear();
    const guardado: TokenInstagramGuardado = {
      accessToken: LONGO,
      expiresAtMs: daqui(40 * DIA),
      semente: SEMENTE,
    };
    const cliente = clienteDe({
      [SEMENTE]: daqui(20 * DIA),
      [LONGO]: daqui(40 * DIA),
    }, vi.fn());
    const resultado = await resolverTokenInstagram(entrada({guardado, cliente}));
    expect(resultado.accessToken).toBe(LONGO);
    expect(cliente.inspecionar).not.toHaveBeenCalled();
    expect(salvar).not.toHaveBeenCalled();
  });

  it("semente nova ganha da cópia ainda válida", async () => {
    salvar.mockClear();
    const nova = "EAASementeNovaDoPainel1234567";
    const guardado: TokenInstagramGuardado = {
      accessToken: LONGO,
      expiresAtMs: daqui(40 * DIA),
      semente: SEMENTE,
    };
    const renovar = vi.fn(async () => ({
      accessToken: NOVO,
      expiresAtMs: daqui(60 * DIA),
    }));
    const cliente = clienteDe({[nova]: daqui(2 * 60 * 60 * 1000)}, renovar);
    const resultado = await resolverTokenInstagram(entrada({
      envToken: nova,
      guardado,
      cliente,
    }));
    expect(resultado.accessToken).toBe(NOVO);
    expect(salvar).toHaveBeenCalledWith(expect.objectContaining({semente: nova}));
  });

  it("segue o token vigente se a troca falha e ainda há prazo", async () => {
    salvar.mockClear();
    const cliente = clienteDe(
      {[SEMENTE]: daqui(10 * DIA)},
      vi.fn(async () => {
        throw new Error(`recusou access_token=${SEMENTE}`);
      }),
    );
    const resultado = await resolverTokenInstagram(entrada({cliente}));
    expect(resultado).toMatchObject({
      accessToken: SEMENTE,
      renovou: false,
      aviso: "renovacao-falhou",
    });
    expect(resultado.detalhe).not.toContain(SEMENTE);
    expect(salvar).not.toHaveBeenCalled();
  });

  it("recusa a semente vencida", async () => {
    const cliente = clienteDe({}, vi.fn());
    await expect(resolverTokenInstagram(entrada({cliente}))).rejects.toBeInstanceOf(
      InstagramBloqueadoError,
    );
  });

  it("propaga falha de rede", async () => {
    const cliente: ClienteTokenInstagram = {
      inspecionar: vi.fn(async () => {
        throw new InstagramRedeError();
      }),
      renovar: vi.fn(),
    };
    await expect(resolverTokenInstagram(entrada({cliente}))).rejects.toBeInstanceOf(
      InstagramRedeError,
    );
  });
});
