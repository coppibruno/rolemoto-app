import { LABELS_CATEGORIA_LOCAL } from "@/app/(app)/feed/constants";
import { formatarHorarioLocal } from "@/lib/horario-local";
import type { CategoriaLocal, HorarioDiaLocal } from "@/types/local";
import { origemConvite } from "./origem-convite";

export type DadosConviteLocal = {
  id: string;
  nome: string;
  endereco: string;
  categoria: CategoriaLocal;
  aberto24h: boolean;
  horarios: HorarioDiaLocal[];
};

export const urlConviteLocal = (id: string): string =>
  `${origemConvite()}/l/${id}`;

export const textoConviteLocal = (dados: DadosConviteLocal): string => {
  const url = urlConviteLocal(dados.id);
  const horario = formatarHorarioLocal(dados);
  const horarioUtil = horario === "Horário não informado" ? "" : horario;
  const linhas = [
    `📍 ${dados.nome}`,
    `🏷️ ${LABELS_CATEGORIA_LOCAL[dados.categoria]}`,
  ];
  if (horarioUtil) linhas.push(`🕐 ${horarioUtil}`);
  linhas.push(`📫 ${dados.endereco}`, "", "Abre o convite:", url);
  return linhas.join("\n");
};
