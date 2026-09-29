import {
  processarPontos,
  type EstadoCalculo,
  type PontoGps,
} from "./calcular-metricas";

const remotoTemDados = (remoto: EstadoCalculo): boolean =>
  remoto.distanciaKm > 0 ||
  remoto.velocidadeMaxKmh > 0 ||
  remoto.tempoMovimentoSegundos > 0 ||
  remoto.ultimo != null;

const preferirMaisDistancia = (
  local: EstadoCalculo,
  outro: EstadoCalculo,
): EstadoCalculo => {
  if (!remotoTemDados(outro)) return local;
  if (outro.distanciaKm + 0.01 < local.distanciaKm) {
    return {
      ...local,
      velocidadeMaxKmh: Math.max(
        local.velocidadeMaxKmh,
        outro.velocidadeMaxKmh,
      ),
    };
  }
  return {
    distanciaKm: outro.distanciaKm,
    velocidadeMaxKmh: Math.max(local.velocidadeMaxKmh, outro.velocidadeMaxKmh),
    velocidadeAtualKmh: outro.velocidadeAtualKmh,
    tempoMovimentoSegundos: Math.max(
      local.tempoMovimentoSegundos,
      outro.tempoMovimentoSegundos,
    ),
    primeiro: outro.primeiro ?? local.primeiro,
    ultimo: outro.ultimo ?? local.ultimo,
    paradoDesde: outro.paradoDesde,
  };
};

export const incorporarBuffer = (
  local: EstadoCalculo,
  pontos: PontoGps[],
): EstadoCalculo => {
  if (pontos.length === 0) return local;
  const ordenados = [...pontos].sort((a, b) => a.t - b.t);
  return preferirMaisDistancia(local, processarPontos(ordenados));
};

export const mesclarComRemoto = (
  local: EstadoCalculo,
  remoto: EstadoCalculo | null,
): EstadoCalculo => {
  if (!remoto) return local;
  return preferirMaisDistancia(local, remoto);
};
