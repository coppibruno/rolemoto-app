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

const chaveDia = (dia: HorarioDiaLocal | HorarioDiaForm): string => {
  if (dia.fechado) return "fechado";
  return `${dia.abertura ?? ""}|${dia.fechamento ?? ""}`;
};

const labelFaixa = (inicio: OpcaoDiaSemana, fim: OpcaoDiaSemana): string =>
  inicio.valor === fim.valor ? inicio.curto : `${inicio.curto}–${fim.curto}`;

export const formatarHorarioLocal = (
  local: Pick<Local, "aberto24h" | "horarios">,
): string => {
  if (local.aberto24h) return "Aberto 24 horas";
  if (!local.horarios.length) return "Horário não informado";

  const porDia = new Map(local.horarios.map((item) => [item.dia, item]));
  const grupos: string[] = [];
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
    const faixa = labelFaixa(inicio, fim);
    grupos.push(
      atual.fechado
        ? `${faixa} fechado`
        : `${faixa} ${atual.abertura}–${atual.fechamento}`,
    );
    i = fimIdx + 1;
  }

  return grupos.join(" · ") || "Horário não informado";
};
