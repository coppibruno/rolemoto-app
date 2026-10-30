export type CardAgenda = {
  slug: string;
  tipo: string;
  dia: string;
  mes: string;
  cidade: string;
  uf: string;
  titulo: string;
  hora: string;
  texto: string;
  fotoUrl: string;
};

const decodificar = (valor: string): string =>
  valor
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) =>
      String.fromCodePoint(Number(dec)),
    )
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

const ufDe = (cidade: string): string | null => {
  const match = /, ([A-Z]{2})$/.exec(cidade);
  return match ? match[1] : null;
};

const cardDe = (bloco: string): CardAgenda | null => {
  const slug = /href="\/eventos\/([a-z0-9-]{8,120})"/.exec(bloco)?.[1];
  const tipo = /class="event-type"[^>]*>([^<]+)/.exec(bloco)?.[1];
  const data =
    /class="event-date-stamp"><strong>([^<]+)<\/strong><small>([^<]+)/
      .exec(bloco);
  const overlay =
    /class="event-card-overlay"><span>([^<]+)<\/span><strong>([^<]+)/
      .exec(bloco);
  if (!slug || !tipo || !data || !overlay) {
    return null;
  }
  const cidade = decodificar(overlay[1]);
  const uf = ufDe(cidade);
  if (!uf) {
    return null;
  }
  const foto =
    /url\((?:&#x27;|'|&apos;)(https:[^'")]+?)(?:&#x27;|'|&apos;)\)/.exec(bloco);
  const hora = /lucide-clock[\s\S]*?<\/svg>\s*([0-9]{1,2}:[0-9]{2})/.exec(bloco);
  const texto = /<p>([^<]*)<\/p>/.exec(bloco);
  return {
    slug,
    tipo: decodificar(tipo),
    dia: decodificar(data[1]),
    mes: decodificar(data[2]),
    cidade,
    uf,
    titulo: decodificar(overlay[2]),
    hora: hora?.[1] ?? "",
    texto: decodificar(texto?.[1] ?? ""),
    fotoUrl: decodificar(foto?.[1] ?? ""),
  };
};

export const parsearAgendaMotoClub = (html: string): CardAgenda[] => {
  const grade = html.split("<div class=\"events-grid\">")[1] ?? "";
  if (!grade) {
    return [];
  }
  const blocos = grade.split("<div class=\"event-card ");
  const cards: CardAgenda[] = [];
  const vistos = new Set<string>();
  for (const bloco of blocos.slice(1)) {
    const card = cardDe(bloco);
    if (!card || vistos.has(card.slug)) {
      continue;
    }
    vistos.add(card.slug);
    cards.push(card);
  }
  return cards;
};
