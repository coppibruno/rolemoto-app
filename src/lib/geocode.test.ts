import { afterEach, describe, expect, it, vi } from "vitest";
import { geocodeService } from "./geocode";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const hit = (parcial: {
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  address?: Record<string, string>;
}) => parcial;

const mockFetch = (resolver: (url: string) => unknown) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      return {
        ok: true,
        json: async () => resolver(url),
      };
    }),
  );
};

describe("geocodeService.buscar", () => {
  it("envia viewbox Sul e bounded nas buscas de cadastro", async () => {
    mockFetch(() => []);
    await geocodeService.buscar("almirante vila nova");
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("viewbox=");
    expect(url).toContain("bounded=1");
    expect(url).toContain("countrycodes=br");
  });

  it("não aplica viewbox quando restritoSul é false", async () => {
    mockFetch(() => []);
    await geocodeService.buscar("paulista", { restritoSul: false });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).not.toContain("viewbox=");
    expect(url).not.toContain("bounded=1");
  });

  it("descarta hit fora do Sul", async () => {
    mockFetch(() => [
      hit({
        lat: "-23.5505",
        lon: "-46.6333",
        display_name: "Av. Paulista, São Paulo",
        address: { state: "São Paulo", "ISO3166-2-lvl4": "BR-SP" },
      }),
    ]);
    const itens = await geocodeService.buscar("avenida paulista");
    expect(itens).toEqual([]);
  });

  it("faz fallback por tokens quando a 1ª busca volta vazia", async () => {
    mockFetch((url) => {
      if (url.includes("posto+petrobras") || url.includes("q=posto")) {
        return [];
      }
      return [
        hit({
          lat: "-26.912",
          lon: "-49.088",
          name: "Posto Almirante",
          display_name: "Posto Almirante, Vila Nova, Blumenau, SC",
          address: {
            suburb: "Vila Nova",
            city: "Blumenau",
            state: "Santa Catarina",
            "ISO3166-2-lvl4": "BR-SC",
          },
        }),
      ];
    });
    const itens = await geocodeService.buscar("posto petrobras vila nova");
    expect(itens).toHaveLength(1);
    expect(itens[0]?.label).toContain("Almirante");
    expect(itens[0]?.label).toContain("Vila Nova");
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("petrobras");
    expect(String(fetchMock.mock.calls[1]?.[0])).not.toContain("posto");
  });
});
