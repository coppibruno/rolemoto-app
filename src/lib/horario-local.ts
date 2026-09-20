import type { DiaSemana, HorarioDiaForm, HorarioDiaLocal, Local } from "@/types/local";

export type OpcaoDiaSemana = {
  valor: DiaSemana;
  label: string;
  curto: string;
};

/** Ordem de exibição (segunda → domingo). */
export const DIAS_SEMANA_UI: OpcaoDiaSemana[] = [
  { valor: 1, label: "Segunda", curto: "Seg" },
  { valor: 2, label: "Terça", curto: "Ter" },
  { valor: 3, label: "Quarta", curto: "Qua" },
  { valor: 4, label: "Quinta", curto: "Qui" },
  { valor: 5, label: "Sexta", curto: "Sex" },
  { valor: 6, label: "Sábado", curto: "Sáb" },
  { valor: 0, label: "Domingo", curto: "Dom" },
];

export type GrupoHorario = {
  inicio: OpcaoDiaSemana;
  fim: OpcaoDiaSemana;
  fechado: boolean;
  abertura: string | null;
  fechamento: string | null;
};

export type LabelStatusAberto = "Aberto agora" | "Fechado" | "24 horas";

const chaveDia = (dia: HorarioDiaLocal | HorarioDiaForm): string => {
  if (dia.fechado) return "fechado";
  return `${dia.abertura ?? ""}|${dia.fechamento ?? ""}`;
};

const labelFaixa = (inicio: OpcaoDiaSemana, fim: OpcaoDiaSemana): string =>
  inicio.valor === fim.valor ? inicio.curto : `${inicio.curto}–${fim.curto}`;

const minutosDoRelogio = (hhmm: string): number => {
  const [hora, minuto] = hhmm.split(":").map(Number);
  return hora * 60 + minuto;
};

const estaNoIntervalo = (
  agoraMin: number,
  abertura: string,
  fechamento: string,
): boolean => {
  const abre = minutosDoRelogio(abertura);
  const fecha = minutosDoRelogio(fechamento);
  if (fecha < abre) {
    return agoraMin >= abre || agoraMin < fecha;
  }
  return agoraMin >= abre && agoraMin < fecha;
};

export const agruparHorarios = (
  horarios: HorarioDiaLocal[],
): GrupoHorario[] => {
  const porDia = new Map(horarios.map((item) => [item.dia, item]));
  const grupos: GrupoHorario[] = [];
  let i = 0;

  while (i < DIAS_SEMANA_UI.length) {
    const inicio = DIAS_SEMANA_UI[i];
    const atual = porDia.get(inicio.valor);
    if (!atual) {
      i += 1;
      continue;
    }
    const chave = chaveDia(atual);
    let fimIdx = i;
    while (fimIdx + 1 < DIAS_SEMANA_UI.length) {
      const proximo = porDia.get(DIAS_SEMANA_UI[fimIdx + 1].valor);
      if (!proximo || chaveDia(proximo) !== chave) break;
      fimIdx += 1;
    }
    const fim = DIAS_SEMANA_UI[fimIdx];
    grupos.push({
      inicio,
      fim,
      fechado: atual.fechado,
      abertura: atual.abertura ?? null,
      fechamento: atual.fechamento ?? null,
    });
    i = fimIdx + 1;
  }

  return grupos;
};

export const formatarHorarioLocal = (
  local: Pick<Local, "aberto24h" | "horarios">,
): string => {
  if (local.aberto24h) return "Aberto 24 horas";
  if (!local.horarios.length) return "Horário não informado";

  const grupos = agruparHorarios(local.horarios).map((grupo) => {
    const faixa = labelFaixa(grupo.inicio, grupo.fim);
    return grupo.fechado
      ? `${faixa} fechado`
      : `${faixa} ${grupo.abertura}–${grupo.fechamento}`;
  });

  return grupos.join(" · ") || "Horário não informado";
};

export const estaAbertoAgora = (
  local: Pick<Local, "aberto24h" | "horarios">,
  agora: Date = new Date(),
): boolean => {
  if (local.aberto24h) return true;
  const dia = agora.getDay() as DiaSemana;
  const faixa = local.horarios.find((item) => item.dia === dia);
  if (!faixa || faixa.fechado || !faixa.abertura || !faixa.fechamento) {
    return false;
  }
  const agoraMin = agora.getHours() * 60 + agora.getMinutes();
  return estaNoIntervalo(agoraMin, faixa.abertura, faixa.fechamento);
};

export const labelStatusAberto = (
  local: Pick<Local, "aberto24h" | "horarios">,
  agora: Date = new Date(),
): LabelStatusAberto => {
  if (local.aberto24h) return "24 horas";
  return estaAbertoAgora(local, agora) ? "Aberto agora" : "Fechado";
};
