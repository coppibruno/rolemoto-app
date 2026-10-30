import {log} from "../log";
import {localRepository, sugestaoLocalRepository} from "../../repositories";
import {
  classificarDestinosMoto,
  type ItemClassificacao,
} from "./classificar-destino-moto";
import {escolherSugestoes, type CandidatoComSemente} from "./escolher-sugestoes-local";
import {PlacesNaoConfiguradoError} from "./erros";
import {consultasDaSemente, type FacetaBusca} from "./facetas-busca";
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
  const candidatos: CandidatoComSemente[] = [];
  let lidas = 0;

  for (const semente of rodada.sementes) {
    const consultas = consultasDaSemente(facetas, semente.nome, semente.uf);
    for (const consulta of consultas) {
      let lugares = await buscarLugaresPlaces(
        chave,
        consulta.texto,
        semente,
        consulta.tipo,
      );
      if (lugares.length === 0 && consulta.tipo) {
        lugares = await buscarLugaresPlaces(chave, consulta.texto, semente);
      }
      lidas += lugares.length;
      for (const lugar of lugares) {
        candidatos.push({...lugar, semente, faceta: consulta.faceta});
      }
    }
  }

  const paraIa: ItemClassificacao[] = [];
  for (const candidato of candidatos) {
    if (candidato.faceta === "turismo") {
      paraIa.push({
        placeId: candidato.placeId,
        nome: candidato.nome,
        resumo: candidato.resumo,
        sementeNome: candidato.semente.nome,
        faceta: candidato.faceta,
      });
    }
  }
  const aceitosIa = await classificarDestinosMoto(paraIa);
  const comDestino = candidatos.map((candidato) => ({
    ...candidato,
    destinoMoto: aceitosIa.has(candidato.placeId),
  }));

  const [ids, locais] = await Promise.all([
    sugestaoLocalRepository.listarIds(),
    localRepository.listar(),
  ]);
  const escolhidos = escolherSugestoes({
    candidatos: comDestino,
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
