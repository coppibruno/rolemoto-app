import type { HorarioDiaForm } from "@/types/local";
import { DIAS_SEMANA_UI } from "@/lib/horario-local";
import { HORA_ABERTURA_PADRAO, HORA_FECHAMENTO_PADRAO } from "./constants";

export const horariosPadraoEspecifico = (): HorarioDiaForm[] =>
  DIAS_SEMANA_UI.map(({ valor }) => ({
    dia: valor,
    fechado: valor === 0,
    abertura: HORA_ABERTURA_PADRAO,
    fechamento: HORA_FECHAMENTO_PADRAO,
  }));
