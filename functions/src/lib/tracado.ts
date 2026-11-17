/**
 * Espelho do encoded polyline / velocidades de `src/lib/telemetria/tracado.ts`
 * (formato Google, precisão 5; velocidades em décimos de km/h).
 */
const PRECISAO = 1e5;
const PRECISAO_VELOCIDADE = 10;

export type PontoLatLng = {lat: number; lng: number};

const codificarValor = (valor: number): string => {
  let restante = valor < 0 ? ~(valor << 1) : valor << 1;
  let saida = "";
  while (restante >= 0x20) {
    saida += String.fromCharCode((0x20 | (restante & 0x1f)) + 63);
    restante >>= 5;
  }
  return saida + String.fromCharCode(restante + 63);
};

const lerValorEncoded = (
  texto: string,
  inicio: number,
): {valor: number; proximo: number} | null => {
  let i = inicio;
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
  const valor = resultado & 1 ? ~(resultado >> 1) : resultado >> 1;
  return {valor, proximo: i};
};

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

  while (i < texto.length) {
    const dLat = lerValorEncoded(texto, i);
    if (!dLat) break;
    i = dLat.proximo;
    const dLng = lerValorEncoded(texto, i);
    if (!dLng) break;
    i = dLng.proximo;
    lat += dLat.valor;
    lng += dLng.valor;
    pontos.push({lat: lat / PRECISAO, lng: lng / PRECISAO});
  }
  return pontos;
};

export const codificarVelocidades = (velocidadesKmh: number[]): string => {
  let anterior = 0;
  let saida = "";
  for (const kmh of velocidadesKmh) {
    const atual = Math.round(Math.max(0, kmh) * PRECISAO_VELOCIDADE);
    saida += codificarValor(atual - anterior);
    anterior = atual;
  }
  return saida;
};

/** Tolerante a texto truncado ou inválido. */
export const decodificarVelocidades = (texto: string): number[] => {
  const velocidades: number[] = [];
  let i = 0;
  let atual = 0;
  while (i < texto.length) {
    const lido = lerValorEncoded(texto, i);
    if (!lido) break;
    i = lido.proximo;
    atual += lido.valor;
    velocidades.push(atual / PRECISAO_VELOCIDADE);
  }
  return velocidades;
};
