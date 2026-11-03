export const ROTULOS_DIA_SEMANA = [
  "todo domingo",
  "toda segunda",
  "toda terça",
  "toda quarta",
  "toda quinta",
  "toda sexta",
  "todo sábado",
] as const;

export const PLURAIS_DIA_SEMANA = [
  "domingos",
  "segundas",
  "terças",
  "quartas",
  "quintas",
  "sextas",
  "sábados",
] as const;

export const DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export const rotuloDiaSemana = (dia: number): string =>
  ROTULOS_DIA_SEMANA[dia] ?? "";

export const pluralDiaSemana = (dia: number): string =>
  PLURAIS_DIA_SEMANA[dia] ?? "datas";
