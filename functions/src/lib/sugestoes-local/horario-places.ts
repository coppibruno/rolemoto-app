import type {DiaSemana, HorarioDiaLocal} from "../../types/local";
import {DIAS_SEMANA} from "../../types/local";

const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

type PontoHora = {day?: number; hour?: number; minute?: number};

export type HorarioPlaces = {
  periods?: Array<{open?: PontoHora; close?: PontoHora}>;
  weekdayDescriptions?: string[];
};

export type HorarioConvertido = {
  aberto24h: boolean;
  horarios: HorarioDiaLocal[];
  horarioCompleto: boolean;
};

const vazio = (): HorarioConvertido => ({
  aberto24h: false,
  horarios: [],
  horarioCompleto: false,
});

const hhmm = (hour: number, minute: number): string | null => {
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return null;
  }
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  const texto = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return HORA_RE.test(texto) ? texto : null;
};

const sempreAberto = (hours: HorarioPlaces): boolean => {
  const desc = (hours.weekdayDescriptions ?? []).join(" ").toLowerCase();
  if (/24 horas|24 hours|open 24/.test(desc)) {
    return true;
  }
  const unico = hours.periods?.length === 1 ? hours.periods[0] : null;
  return Boolean(
    unico?.open &&
    unico.open.hour === 0 &&
    (unico.open.minute ?? 0) === 0 &&
    !unico.close,
  );
};

export const montarHorarioPlaces = (
  hours: HorarioPlaces | null | undefined,
): HorarioConvertido => {
  if (!hours) {
    return vazio();
  }
  if (sempreAberto(hours)) {
    return {aberto24h: true, horarios: [], horarioCompleto: true};
  }

  const periods = hours.periods ?? [];
  if (periods.length === 0) {
    return vazio();
  }

  const horarios: HorarioDiaLocal[] = DIAS_SEMANA.map((dia) => {
    const periodo = periods.find((item) => item.open?.day === dia);
    const abertura = periodo?.open ?
      hhmm(periodo.open.hour ?? -1, periodo.open.minute ?? 0) :
      null;
    if (!abertura) {
      return {dia: dia as DiaSemana, fechado: true, abertura: null, fechamento: null};
    }
    if (!periodo?.close) {
      return {dia: dia as DiaSemana, fechado: false, abertura, fechamento: "23:59"};
    }
    const fechamento = hhmm(periodo.close.hour ?? -1, periodo.close.minute ?? 0);
    if (!fechamento || abertura === fechamento) {
      return {dia: dia as DiaSemana, fechado: true, abertura: null, fechamento: null};
    }
    return {dia: dia as DiaSemana, fechado: false, abertura, fechamento};
  });

  if (!horarios.some((dia) => !dia.fechado)) {
    return vazio();
  }
  return {aberto24h: false, horarios, horarioCompleto: true};
};
