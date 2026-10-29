import {log} from "../log";
import {localRepository, sugestaoLocalRepository} from "../../repositories";
import {escolherSugestoes, type CandidatoComSemente} from "./escolher-sugestoes-local";
import {PlacesNaoConfiguradoError} from "./erros";
import {consultasDaRodada, type FacetaBusca} from "./facetas-busca";
import {buscarLugaresPlaces} from "./places-client";
import {fatiaSementes, SEMENTES_POR_RODADA} from "./sementes";

export type ResultadoBuscaSugestoes = {
  sementes: string[];
  lidas: number;
  gravadas: number;
  ignoradas: number;
};

export const executarBuscaSugestoes = async (
  facetas: readonly FacetaBusca[],
): Promise<ResultadoBuscaSugestoes> => {
  const chave = (process.env.PLACES_API_KEY ?? "").trim();
  if (!chave) {
    throw new PlacesNaoConfiguradoError();
  }

  const indice = await sugestaoLocalRepository.lerProximoIndice();
  const rodada = fatiaSementes(indice, SEMENTES_POR_RODADA);
  const consultas = consultasDaRodada(facetas);
  const candidatos: CandidatoComSemente[] = [];
  let lidas = 0;

  for (const semente of rodada.sementes) {
    for (const consulta of consultas) {
      const lugares = await buscarLugaresPlaces(chave, consulta.texto, semente);
      lidas += lugares.length;
      for (const lugar of lugares) {
        candidatos.push({...lugar, semente, faceta: consulta.faceta});
      }
    }
  }

  const [ids, locais] = await Promise.all([
    sugestaoLocalRepository.listarIds(),
    localRepository.listar(),
  ]);
  const escolhidos = escolherSugestoes({
    candidatos,
    sugestoesIds: new Set(ids),
    locais: locais.map((local) => ({
      googlePlaceId: local.googlePlaceId,
      nome: local.nome,
      lat: local.lat,
      lng: local.lng,
    })),
  });

  let gravadas = 0;
  for (const item of escolhidos) {
    const criou = await sugestaoLocalRepository.criar(item);
    if (criou) {
      gravadas += 1;
    }
  }

  await sugestaoLocalRepository.gravarProximoIndice(rodada.proximoIndice);
  const resultado = {
    sementes: rodada.sementes.map((semente) => semente.id),
    lidas,
    gravadas,
    ignoradas: Math.max(0, lidas - gravadas),
  };
  log.info("SugestaoLocal", "Rodada concluída", resultado);
  return resultado;
};
