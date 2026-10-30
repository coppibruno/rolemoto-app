import {MotoClubConsultaError} from "./erros";

const ORIGEM = "https://motoclub.run";

const headers = {
  Accept: "text/html",
  "Accept-Language": "pt-BR",
  "User-Agent": "Mozilla/5.0 (compatible; Rolemoto/1.0)",
};

const baixar = async (url: string): Promise<string> => {
  const resposta = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(20000),
  });
  if (!resposta.ok) {
    throw new MotoClubConsultaError();
  }
  return resposta.text();
};

export const buscarAgendaMotoClub = (): Promise<string> =>
  baixar(`${ORIGEM}/eventos`);

export const buscarPaginaMotoClub = (slug: string): Promise<string> =>
  baixar(`${ORIGEM}/eventos/${encodeURIComponent(slug)}`);

export const urlEventoMotoClub = (slug: string): string =>
  `${ORIGEM}/eventos/${slug}`;
