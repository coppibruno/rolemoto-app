const TZ = "America/Sao_Paulo";

const ymdSaoPaulo = (data: Date): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(data);

const somarDiasYmd = (ymd: string, dias: number): string => {
  const [ano, mes, dia] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(ano, mes - 1, dia + dias));
  return dt.toISOString().slice(0, 10);
};

export const formatarHora = (iso: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));

const capitalizar = (texto: string): string =>
  texto.charAt(0).toUpperCase() + texto.slice(1);

const formatarDiaMes = (data: Date): string =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
  }).format(data);

const nomeDiaSemana = (data: Date): string =>
  capitalizar(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: TZ,
      weekday: "long",
    }).format(data),
  );

/** Faixa do hero do convite: "Quarta-feira, 18/11 • Encontro às 06:30h". */
export const formatarFaixaHero = (iso: string): string => {
  const data = new Date(iso);
  return `${nomeDiaSemana(data)}, ${formatarDiaMes(data)} • Encontro às ${formatarHora(iso)}h`;
};

/** "Quarta-feira, 18/11 · 14:30". Hoje e amanhã também levam o dia/mês. */
export const formatarHorarioSaida = (iso: string): string => {
  const data = new Date(iso);
  const hora = formatarHora(iso);
  const diaMes = formatarDiaMes(data);
  const ymd = ymdSaoPaulo(data);
  const hoje = ymdSaoPaulo(new Date());
  if (ymd === hoje) return `Hoje, ${diaMes} · ${hora}`;
  if (ymd === somarDiasYmd(hoje, 1)) return `Amanhã, ${diaMes} · ${hora}`;
  return `${nomeDiaSemana(data)}, ${diaMes} · ${hora}`;
};

/** Badge do card de evento: "Quarta-feira, 18/11 às 19:30". */
export const formatarHorarioEvento = (iso: string): string => {
  const data = new Date(iso);
  const hora = formatarHora(iso);
  const diaMes = formatarDiaMes(data);
  const ymd = ymdSaoPaulo(data);
  const hoje = ymdSaoPaulo(new Date());
  if (ymd === hoje) return `Hoje, ${diaMes} às ${hora}`;
  if (ymd === somarDiasYmd(hoje, 1)) return `Amanhã, ${diaMes} às ${hora}`;
  return `${nomeDiaSemana(data)}, ${diaMes} às ${hora}`;
};

export const formatarPeriodoEvento = (
  aberturaIso: string,
  encerramentoIso: string | null,
): string => {
  const inicio = formatarHorarioEvento(aberturaIso);
  if (!encerramentoIso) return inicio;
  const ymdAbertura = ymdSaoPaulo(new Date(aberturaIso));
  const ymdFim = ymdSaoPaulo(new Date(encerramentoIso));
  if (ymdAbertura === ymdFim) {
    return `${inicio} · até ${formatarHora(encerramentoIso)}`;
  }
  return `${inicio} até ${formatarHorarioEvento(encerramentoIso)}`;
};

export const formatarDataCurta = (ymd: string): string => {
  const [ano, mes, dia] = ymd.split("-").map(Number);
  return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
};
