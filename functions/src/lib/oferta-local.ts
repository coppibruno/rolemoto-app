import type {
  OfertaLocal,
  OfertaLocalCliente,
  OfertaLocalDados,
  OfertaVigenteResumo,
  TipoOfertaLocal,
} from "../types/oferta-local";
import {
  horaSaoPaulo,
  paredeSaoPauloParaDate,
  somarDiasYmd,
  weekdaySaoPaulo,
  ymdSaoPaulo,
} from "./quando";

export const LIMITE_OFERTAS_POR_LOCAL = 5;

const TIPOS: TipoOfertaLocal[] = ["preco", "percentual", "brinde"];
const RE_CODIGO = /^[A-Z0-9]{4,8}$/;
const RE_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const PRECO_MAX = 99999.99;

type ResultadoValidacao =
  | {ok: true; dados: OfertaLocalDados}
  | {ok: false; erro: string};

const texto = (valor: unknown): string =>
  typeof valor === "string" ? valor.trim() : "";

const ausente = (valor: unknown): boolean =>
  valor === undefined || valor === null || valor === "";

const ateDuasCasas = (valor: number): boolean =>
  Math.abs(Math.round(valor * 100) - valor * 100) < 1e-6;

export const normalizarCodigo = (valor: unknown): string =>
  typeof valor === "string" ? valor.replace(/\s+/g, "").toUpperCase() : "";

const validarValor = (
  tipo: TipoOfertaLocal,
  valor: unknown,
): {ok: true; valor: number | null} | {ok: false; erro: string} => {
  if (tipo === "brinde") {
    return ausente(valor) ? {ok: true, valor: null} : {ok: false, erro: "Brinde não leva valor"};
  }
  if (tipo === "preco") {
    const ok = typeof valor === "number" && Number.isFinite(valor) &&
      valor > 0 && valor <= PRECO_MAX && ateDuasCasas(valor);
    return ok ? {ok: true, valor: valor as number} : {ok: false, erro: "Informe o preço"};
  }
  const ok = typeof valor === "number" && Number.isInteger(valor) && valor >= 1 && valor <= 100;
  return ok ?
    {ok: true, valor: valor as number} :
    {ok: false, erro: "Informe o percentual de 1 a 100"};
};

const validarDias = (valor: unknown): number[] | null => {
  if (valor === undefined || valor === null) {
    return [];
  }
  if (!Array.isArray(valor)) {
    return null;
  }
  const vistos = new Set<number>();
  for (const dia of valor) {
    const valido = typeof dia === "number" && Number.isInteger(dia) && dia >= 0 && dia <= 6;
    if (!valido || vistos.has(dia)) {
      return null;
    }
    vistos.add(dia);
  }
  return [...vistos].sort((a, b) => a - b);
};

const validarFaixa = (
  inicioBruto: unknown,
  fimBruto: unknown,
): {ok: true; inicio: string | null; fim: string | null} | {ok: false; erro: string} => {
  const semInicio = ausente(inicioBruto);
  const semFim = ausente(fimBruto);
  if (semInicio && semFim) {
    return {ok: true, inicio: null, fim: null};
  }
  if (semInicio || semFim) {
    return {ok: false, erro: "Informe início e fim, ou deixe os dois vazios"};
  }
  if (
    typeof inicioBruto !== "string" || typeof fimBruto !== "string" ||
    !RE_HORA.test(inicioBruto) || !RE_HORA.test(fimBruto)
  ) {
    return {ok: false, erro: "Horário inválido"};
  }
  if (fimBruto <= inicioBruto) {
    return {ok: false, erro: "O fim precisa ser depois do início"};
  }
  return {ok: true, inicio: inicioBruto, fim: fimBruto};
};

/** Devolve a primeira falha, na ordem da tabela da SPEC 059 (seção 4.6). */
export const validarOferta = (body: unknown): ResultadoValidacao => {
  const bruto = body && typeof body === "object" ? body as Record<string, unknown> : {};

  const titulo = texto(bruto.titulo);
  if (!titulo || titulo.length > 60) {
    return {ok: false, erro: "Dê um nome de até 60 caracteres"};
  }
  if (typeof bruto.tipo !== "string" || !TIPOS.includes(bruto.tipo as TipoOfertaLocal)) {
    return {ok: false, erro: "tipo inválido"};
  }
  const tipo = bruto.tipo as TipoOfertaLocal;
  const valor = validarValor(tipo, bruto.valor);
  if (!valor.ok) {
    return valor;
  }
  const codigo = normalizarCodigo(bruto.codigo);
  if (!RE_CODIGO.test(codigo)) {
    return {ok: false, erro: "O código tem de 4 a 8 letras ou números"};
  }
  const regra = texto(bruto.regra);
  if (!regra || regra.length > 280) {
    return {ok: false, erro: "Escreva a regra em até 280 caracteres"};
  }
  let tetoDia: number | null = null;
  if (!ausente(bruto.tetoDia)) {
    const teto = bruto.tetoDia;
    if (typeof teto !== "number" || !Number.isInteger(teto) || teto < 1 || teto > 999) {
      return {ok: false, erro: "O teto por dia é de 1 a 999"};
    }
    tetoDia = teto;
  }
  const dias = validarDias(bruto.dias);
  if (!dias) {
    return {ok: false, erro: "Dia inválido"};
  }
  const faixa = validarFaixa(bruto.horaInicio, bruto.horaFim);
  if (!faixa.ok) {
    return faixa;
  }

  return {
    ok: true,
    dados: {
      titulo,
      tipo,
      valor: valor.valor,
      codigo,
      regra,
      tetoDia,
      dias,
      horaInicio: faixa.inicio,
      horaFim: faixa.fim,
    },
  };
};

type JanelaOferta = Pick<OfertaLocal, "ativa" | "dias" | "horaInicio" | "horaFim">;

/** Ativa, num dia de `dias` (ou qualquer dia) e dentro da faixa, no relógio de São Paulo. */
export const ofertaVigente = (oferta: JanelaOferta, agora: Date): boolean => {
  if (!oferta.ativa) {
    return false;
  }
  if (oferta.dias.length > 0 && !oferta.dias.includes(weekdaySaoPaulo(agora))) {
    return false;
  }
  if (!oferta.horaInicio || !oferta.horaFim) {
    return true;
  }
  const hora = horaSaoPaulo(agora.toISOString());
  return hora >= oferta.horaInicio && hora < oferta.horaFim;
};

/** A vigente de `updatedAt` mais recente, ou `null`. */
export const ofertaDoCard = <T extends OfertaLocal>(ofertas: T[], agora: Date): T | null => {
  let escolhida: T | null = null;
  for (const oferta of ofertas) {
    if (!ofertaVigente(oferta, agora)) {
      continue;
    }
    if (!escolhida || oferta.updatedAt > escolhida.updatedAt) {
      escolhida = oferta;
    }
  }
  return escolhida;
};

const formatoPreco = (valor: number): string =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: Number.isInteger(valor) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(valor);

export const rotuloOferta = (tipo: TipoOfertaLocal, valor: number | null): string => {
  if (tipo === "brinde" || valor === null) {
    return "BRINDE";
  }
  return tipo === "percentual" ? `${valor}%` : `R$ ${formatoPreco(valor)}`;
};

export const paraOfertaCliente = (
  oferta: OfertaLocal,
  agora: Date,
  verCodigoSempre: boolean,
): OfertaLocalCliente => {
  const vigente = ofertaVigente(oferta, agora);
  return {
    id: oferta.id,
    titulo: oferta.titulo,
    tipo: oferta.tipo,
    valor: oferta.valor,
    rotulo: rotuloOferta(oferta.tipo, oferta.valor),
    codigo: verCodigoSempre || vigente ? oferta.codigo : null,
    regra: oferta.regra,
    tetoDia: oferta.tetoDia,
    dias: oferta.dias,
    horaInicio: oferta.horaInicio,
    horaFim: oferta.horaFim,
    ativa: oferta.ativa,
    vigente,
  };
};

export const resumoVigente = (oferta: OfertaLocal): OfertaVigenteResumo => ({
  id: oferta.id,
  titulo: oferta.titulo,
  rotulo: rotuloOferta(oferta.tipo, oferta.valor),
  tetoDia: oferta.tetoDia,
  dias: oferta.dias,
  horaInicio: oferta.horaInicio,
  horaFim: oferta.horaFim,
});

/** Segunda-feira 00:00 em America/Sao_Paulo da semana de `agora`. */
export const inicioSemanaSaoPaulo = (agora: Date): Date => {
  const voltar = (weekdaySaoPaulo(agora) + 6) % 7;
  return paredeSaoPauloParaDate(somarDiasYmd(ymdSaoPaulo(agora), -voltar));
};
