export type DetalheMotoClub = {
  nome: string;
  inicioBruto: string;
  fimBruto: string | null;
  localNome: string;
  cidade: string;
  uf: string;
  endereco: string;
  descricao: string;
};

const objetosDe = (valor: unknown): Record<string, unknown>[] => {
  if (Array.isArray(valor)) {
    return valor.flatMap(objetosDe);
  }
  if (!valor || typeof valor !== "object") {
    return [];
  }
  const objeto = valor as Record<string, unknown>;
  if (objeto["@graph"]) {
    return objetosDe(objeto["@graph"]);
  }
  return [objeto];
};

const ehEvento = (objeto: Record<string, unknown>): boolean => {
  const tipo = objeto["@type"];
  if (tipo === "Event") {
    return true;
  }
  return Array.isArray(tipo) && tipo.includes("Event");
};

const texto = (valor: unknown): string =>
  typeof valor === "string" ? valor.replace(/\s+/g, " ").trim() : "";

const detalheDe = (evento: Record<string, unknown>): DetalheMotoClub | null => {
  const nome = texto(evento.name);
  const inicioBruto = texto(evento.startDate);
  if (!nome || !inicioBruto) {
    return null;
  }
  const local = evento.location;
  const lugar = local && typeof local === "object" ?
    local as Record<string, unknown> :
    {};
  const enderecoBruto = lugar.address;
  const address = enderecoBruto && typeof enderecoBruto === "object" ?
    enderecoBruto as Record<string, unknown> :
    {};
  const localNome = texto(lugar.name) || texto(address.streetAddress);
  const cidade = texto(address.addressLocality);
  const uf = texto(address.addressRegion).toUpperCase();
  const rua = texto(address.streetAddress);
  const endereco = [rua, cidade, uf].filter(Boolean).join(", ");
  return {
    nome,
    inicioBruto,
    fimBruto: texto(evento.endDate) || null,
    localNome,
    cidade,
    uf,
    endereco,
    descricao: texto(evento.description),
  };
};

export const parsearDetalheMotoClub = (html: string): DetalheMotoClub | null => {
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  for (const match of html.matchAll(re)) {
    let dados: unknown;
    try {
      dados = JSON.parse(match[1]);
    } catch {
      continue;
    }
    for (const objeto of objetosDe(dados)) {
      if (!ehEvento(objeto)) {
        continue;
      }
      const detalhe = detalheDe(objeto);
      if (detalhe) {
        return detalhe;
      }
    }
  }
  return null;
};
