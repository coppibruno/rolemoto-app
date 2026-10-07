import type { PontoLatLng } from "@/lib/mapa-tiles";
import {
  aplicarPonto,
  descartarRedeComGps,
  estadoCalculoInicial,
  type PontoGps,
} from "./calcular-metricas";

/** Mais rígido que o cálculo de km: fix de rede desenha zigue-zague no mapa. */
const ACCURACY_TRACADO_M = 50;
const TOLERANCIA_INICIAL_M = 8;
/** Mantém o polyline abaixo do limite do POST (20 mil caracteres). */
export const MAX_PONTOS_TRACADO = 1500;
const METROS_POR_GRAU = 111_320;
const PRECISAO = 1e5;

type Xy = { x: number; y: number };

/** Pontos aceitos pelo mesmo filtro de saltos das métricas, em ordem de tempo. */
export const pontosDoTracado = (pontos: PontoGps[]): PontoLatLng[] => {
  const ordenados = descartarRedeComGps(pontos);
  const aceitos: PontoLatLng[] = [];
  let estado = estadoCalculoInicial();
  for (const ponto of ordenados) {
    if (ponto.accuracy != null && ponto.accuracy > ACCURACY_TRACADO_M) continue;
    const proximo = aplicarPonto(estado, ponto);
    if (proximo.ultimo && proximo.ultimo !== estado.ultimo) {
      aceitos.push({ lat: proximo.ultimo.lat, lng: proximo.ultimo.lng });
    }
    estado = proximo;
  }
  return aceitos;
};

const distanciaAoSegmento = (p: Xy, a: Xy, b: Xy): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const comprimento2 = dx * dx + dy * dy;
  const t =
    comprimento2 === 0
      ? 0
      : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / comprimento2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
};

/** Douglas-Peucker iterativo, com distâncias em metros (projeção local). */
export const simplificarTracado = (
  pontos: PontoLatLng[],
  toleranciaM: number,
): PontoLatLng[] => {
  const n = pontos.length;
  if (n <= 2) return pontos;
  const lat0 = pontos[0].lat;
  const lng0 = pontos[0].lng;
  const escalaLng = Math.cos((lat0 * Math.PI) / 180) * METROS_POR_GRAU;
  const xy = pontos.map((p) => ({
    x: (p.lng - lng0) * escalaLng,
    y: (p.lat - lat0) * METROS_POR_GRAU,
  }));

  const manter = new Uint8Array(n);
  manter[0] = 1;
  manter[n - 1] = 1;
  const pilha: Array<[number, number]> = [[0, n - 1]];
  while (pilha.length > 0) {
    const [i, j] = pilha.pop() as [number, number];
    let maior = 0;
    let indice = -1;
    for (let k = i + 1; k < j; k += 1) {
      const d = distanciaAoSegmento(xy[k], xy[i], xy[j]);
      if (d > maior) {
        maior = d;
        indice = k;
      }
    }
    if (indice !== -1 && maior > toleranciaM) {
      manter[indice] = 1;
      pilha.push([i, indice], [indice, j]);
    }
  }
  return pontos.filter((_, i) => manter[i] === 1);
};

const codificarValor = (valor: number): string => {
  let restante = valor < 0 ? ~(valor << 1) : valor << 1;
  let saida = "";
  while (restante >= 0x20) {
    saida += String.fromCharCode((0x20 | (restante & 0x1f)) + 63);
    restante >>= 5;
  }
  return saida + String.fromCharCode(restante + 63);
};

/** Encoded polyline (formato Google, precisão 5). */
export const codificarPolyline = (pontos: PontoLatLng[]): string => {
  let latAnterior = 0;
  let lngAnterior = 0;
  let saida = "";
  for (const p of pontos) {
    const lat = Math.round(p.lat * PRECISAO);
    const lng = Math.round(p.lng * PRECISAO);
    saida += codificarValor(lat - latAnterior) + codificarValor(lng - lngAnterior);
    latAnterior = lat;
    lngAnterior = lng;
  }
  return saida;
};

/** Tolerante a texto truncado ou inválido: devolve o que conseguiu ler. */
export const decodificarPolyline = (texto: string): PontoLatLng[] => {
  const pontos: PontoLatLng[] = [];
  let i = 0;
  let lat = 0;
  let lng = 0;

  const lerValor = (): number | null => {
    let resultado = 0;
    let shift = 0;
    let byte: number;
    do {
      if (i >= texto.length || shift > 30) return null;
      byte = texto.charCodeAt(i) - 63;
      i += 1;
      if (byte < 0 || byte > 63) return null;
      resultado |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    return resultado & 1 ? ~(resultado >> 1) : resultado >> 1;
  };

  while (i < texto.length) {
    const dLat = lerValor();
    const dLng = lerValor();
    if (dLat === null || dLng === null) break;
    lat += dLat;
    lng += dLng;
    pontos.push({ lat: lat / PRECISAO, lng: lng / PRECISAO });
  }
  return pontos;
};

/** Traçado pronto para o POST; "" se não houver caminho para desenhar. */
export const gerarTracado = (pontos: PontoGps[]): string => {
  const aceitos = pontosDoTracado(pontos);
  if (aceitos.length < 2) return "";
  let tolerancia = TOLERANCIA_INICIAL_M;
  let simplificado = simplificarTracado(aceitos, tolerancia);
  while (simplificado.length > MAX_PONTOS_TRACADO) {
    tolerancia *= 2;
    simplificado = simplificarTracado(aceitos, tolerancia);
  }
  return codificarPolyline(simplificado);
};
