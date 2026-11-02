export const LIMITE_FOTOS_GALERIA = 5;

export type FotoRecurso = {
  recurso: string;
};

export const idFotoPlaces = (recurso: string): string => {
  const id = recurso.split("/").pop() ?? "";
  return /^[A-Za-z0-9_-]+$/.test(id) ? id : "";
};

/** Lista persistida, ou a capa antiga quando o documento ainda não tem galeria. */
export const galeriaAtual = (
  fotoFachadaUrl: string,
  fotosUrls: unknown,
): string[] => {
  const lista = Array.isArray(fotosUrls) ?
    fotosUrls
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean) :
    [];
  if (lista.length > 0) {
    return lista.slice(0, LIMITE_FOTOS_GALERIA);
  }
  const capa = fotoFachadaUrl.trim();
  return capa ? [capa] : [];
};

const jaIncluiFoto = (
  galeria: readonly string[],
  placeId: string,
  recurso: string,
): boolean => {
  const id = idFotoPlaces(recurso);
  if (!id) {
    return true;
  }
  const arquivo = `${placeId}--${id}.jpg`;
  return galeria.some((url) => url.includes(arquivo));
};

/**
 * Fotos da Places que ainda cabem na galeria.
 * Com capa já gravada, não repete o recurso conhecido (ou a primeira da lista).
 * Sem capa, a primeira foto da Places entra também.
 */
export const escolherFotosExtras = (params: {
  placeId: string;
  galeria: readonly string[];
  fotos: readonly FotoRecurso[];
  recursoCapa: string;
}): string[] => {
  const vagas = LIMITE_FOTOS_GALERIA - params.galeria.length;
  if (vagas <= 0) {
    return [];
  }
  const capa = params.recursoCapa.trim();
  let fila = params.fotos.filter((foto) => foto.recurso);
  if (params.galeria.length > 0) {
    fila = capa ? fila.filter((foto) => foto.recurso !== capa) : fila.slice(1);
  }
  const escolhidas: string[] = [];
  for (const foto of fila) {
    if (escolhidas.length >= vagas) {
      break;
    }
    if (escolhidas.includes(foto.recurso)) {
      continue;
    }
    if (jaIncluiFoto(params.galeria, params.placeId, foto.recurso)) {
      continue;
    }
    escolhidas.push(foto.recurso);
  }
  return escolhidas;
};
