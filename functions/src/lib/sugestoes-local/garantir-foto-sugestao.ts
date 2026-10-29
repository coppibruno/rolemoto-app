import {sugestaoLocalRepository} from "../../repositories";
import type {SugestaoLocal} from "../../types/sugestao-local";
import {erroDe, log} from "../log";
import {baixarFotoPlaces, buscarFotoDoLugar, recursoFotoValido} from "./foto-places";
import {salvarFotoFachada} from "./salvar-foto-fachada";

const semFoto = async (sugestao: SugestaoLocal): Promise<SugestaoLocal> => {
  await sugestaoLocalRepository.gravarFoto(sugestao.id, {
    fotoFachadaUrl: "",
    fotoRecurso: "",
    fotoAtribuicao: "",
    fotoIndisponivel: true,
  });
  return {...sugestao, fotoIndisponivel: true};
};

export const garantirFotoSugestao = async (
  sugestao: SugestaoLocal,
): Promise<SugestaoLocal> => {
  if (sugestao.fotoFachadaUrl || sugestao.fotoIndisponivel) {
    return sugestao;
  }
  const chave = (process.env.PLACES_API_KEY ?? "").trim();
  if (!chave) {
    return sugestao;
  }

  try {
    const conhecida = recursoFotoValido(sugestao.fotoRecurso) ?
      {recurso: sugestao.fotoRecurso, atribuicao: sugestao.fotoAtribuicao || "Google"} :
      await buscarFotoDoLugar(chave, sugestao.placeId);
    if (!conhecida?.recurso) {
      return semFoto(sugestao);
    }

    const arquivo = await baixarFotoPlaces(chave, conhecida.recurso);
    if (!arquivo) {
      return sugestao;
    }
    const url = await salvarFotoFachada(
      sugestao.placeId,
      arquivo.bytes,
      arquivo.contentType,
    );
    const foto = {
      fotoFachadaUrl: url,
      fotoRecurso: conhecida.recurso,
      fotoAtribuicao: conhecida.atribuicao || "Google",
      fotoIndisponivel: false,
    };
    await sugestaoLocalRepository.gravarFoto(sugestao.id, foto);
    return {...sugestao, ...foto};
  } catch (error) {
    log.warn("SugestaoLocal", "Foto da fachada não salva", {
      id: sugestao.id,
      ...erroDe(error),
    });
    return sugestao;
  }
};

export const completarFotosSugestoes = async (
  itens: SugestaoLocal[],
): Promise<SugestaoLocal[]> => {
  const fila = itens.filter((item) => !item.fotoFachadaUrl && !item.fotoIndisponivel);
  const porId = new Map<string, SugestaoLocal>();
  const workers = Array.from({length: Math.min(4, fila.length)}, async () => {
    let item = fila.shift();
    while (item) {
      porId.set(item.id, await garantirFotoSugestao(item));
      item = fila.shift();
    }
  });
  await Promise.all(workers);
  return itens.map((item) => porId.get(item.id) ?? item);
};
