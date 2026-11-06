import {erroDe, log} from "../log";
import {pontoEstaNoSul} from "../regiao-sul";
import {eventoRepository, sugestaoEventoRepository} from "../../repositories";
import type {SugestaoEventoNova} from "../../types/sugestao-evento";
import {
  classificarPostInstagram,
  GeminiCotaError,
} from "./classificar-post-instagram";
import {horaDoIso} from "./datas-evento";
import {
  escolherSugestoesEvento,
  type CandidatoEvento,
  type EventoParaDedupe,
} from "./escolher-sugestoes-evento";
import {InstagramBloqueadoError} from "./erros";
import {geocodificarConsulta, type PontoGeo} from "./geocodificar-sugestao";
import {HASHTAGS_INSTAGRAM} from "./hashtags-instagram";
import {
  completarImagemCarrossel,
  listarMidiasInstagram,
  type MidiaInstagram,
} from "./instagram-client";
import type {CartazInstagram} from "./ler-cartaz-instagram";
import {baixarImagemEvento, gravarFotoEvento} from "./salvar-foto-evento";

export const TETO_GRAVACOES_INSTAGRAM = 8;
/**
 * Plano grátis do Flash-Lite: 10 pedidos por minuto e 500 por dia, por projeto.
 * 20 leituras a cada 6,5 s cabem no minuto e nos 300 s da function.
 */
const TETO_LEITURAS_INSTAGRAM = 20;
const INTERVALO_LEITURA_MS = 6500;
const PAUSA_GEO_MS = 1100;

export type ResultadoInstagram = {
  lidas: number;
  gravadas: number;
  ignoradas: number;
  bloqueada: boolean;
};

const vazio = (bloqueada: boolean): ResultadoInstagram => ({
  lidas: 0,
  gravadas: 0,
  ignoradas: 0,
  bloqueada,
});

const pausa = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const geocodificar = async (consulta: string): Promise<PontoGeo | null> => {
  try {
    return await geocodificarConsulta(consulta);
  } catch (error) {
    log.warn("SugestaoEvento", "Geocódigo do post falhou", erroDe(error));
    return null;
  }
};

type Lugar =
  | {tipo: "sul"; ponto: PontoGeo}
  | {tipo: "sem-pin"}
  | {tipo: "fora"};

/**
 * Só fica o que está em SC, PR ou RS. Pin fora do Sul descarta, a menos que o
 * cartaz diga uma UF do Sul: aí o geocódigo errou e o admin completa o ponto.
 * Sem pin e sem UF não há como saber o estado, e o post fica de fora.
 */
const localizar = async (cartaz: CartazInstagram): Promise<Lugar> => {
  const {lugar, cidade, uf} = cartaz;
  const sufixo = uf ? `${uf}, Brasil` : "Brasil";
  const consultas: string[] = [];
  if (lugar && cidade && lugar !== cidade) {
    consultas.push(`${lugar}, ${cidade}, ${sufixo}`);
  }
  if (lugar) {
    consultas.push(`${lugar}, ${sufixo}`);
  }
  if (cidade && cidade !== lugar) {
    consultas.push(`${cidade}, ${sufixo}`);
  }
  for (const consulta of consultas) {
    const ponto = await geocodificar(consulta);
    await pausa(PAUSA_GEO_MS);
    if (ponto && pontoEstaNoSul(ponto.lat, ponto.lng)) {
      return {tipo: "sul", ponto};
    }
  }
  return uf ? {tipo: "sem-pin"} : {tipo: "fora"};
};

const informacoesDe = (legenda: string, permalink: string): string => {
  const base = legenda.replace(/\s+/g, " ").trim();
  const linha = `Post: ${permalink}`;
  if (!base) {
    return linha.slice(0, 2000);
  }
  const junto = `${base}\n\n${linha}`;
  return junto.slice(0, 2000);
};

const candidatoDe = (
  post: MidiaInstagram,
  cartaz: CartazInstagram,
): CandidatoEvento => ({
  id: `ig_${post.id}`,
  slug: post.id,
  titulo: cartaz.titulo,
  nota: cartaz.nota,
  motivos: cartaz.motivos,
  tipoSugerido: cartaz.tipo,
  inicioIso: cartaz.abertura,
  fimIso: cartaz.encerramento,
  cidade: cartaz.cidade,
  uf: cartaz.uf,
  texto: post.caption,
  fotoUrl: post.mediaUrl,
  hora: horaDoIso(cartaz.abertura),
  urlOrigem: post.permalink,
});

const montar = async (
  post: MidiaInstagram,
  cartaz: CartazInstagram,
  arquivo: {bytes: Buffer; contentType: string} | null,
): Promise<SugestaoEventoNova | null> => {
  const id = `ig_${post.id}`;
  const onde = await localizar(cartaz);
  if (onde.tipo === "fora") {
    log.info("SugestaoEvento", "Post fora de SC, PR e RS", {
      id,
      cidade: cartaz.cidade,
      uf: cartaz.uf,
    });
    return null;
  }
  const ponto = onde.tipo === "sul" ? onde.ponto : null;
  const fotoCapaUrl = arquivo ? await gravarFotoEvento(id, arquivo) : "";
  const cidadeUf = cartaz.cidade && cartaz.uf ?
    `${cartaz.cidade}, ${cartaz.uf}` :
    cartaz.cidade;
  const textoLugar = cartaz.lugar || cidadeUf;
  return {
    id,
    fonte: "instagram",
    slug: post.id,
    urlOrigem: post.permalink,
    titulo: cartaz.titulo,
    tipoSugerido: cartaz.tipo,
    local: {
      lat: ponto?.lat ?? null,
      lng: ponto?.lng ?? null,
      endereco: (ponto?.endereco || textoLugar).slice(0, 300),
      nome: cartaz.lugar.slice(0, 120),
    },
    dataHoraAbertura: cartaz.abertura,
    dataHoraEncerramento: cartaz.encerramento,
    acesso: cartaz.acesso,
    linkIngresso: cartaz.linkIngresso,
    informacoes: informacoesDe(post.caption, post.permalink),
    fotoCapaUrl,
    nota: cartaz.nota,
    motivos: cartaz.motivos,
    cidade: ponto ? (cidadeUf || cartaz.lugar) : textoLugar,
  };
};

type Leitura = {
  post: MidiaInstagram;
  cartaz: CartazInstagram;
  arquivo: {bytes: Buffer; contentType: string} | null;
};

/** Post com legenda e imagem primeiro: é onde o cartaz costuma estar. */
const pesoDoPost = (post: MidiaInstagram): number =>
  (post.caption.trim() ? 0 : 2) + (post.mediaType === "VIDEO" ? 1 : 0);

const lerPost = async (
  token: string,
  bruto: MidiaInstagram,
  agora: Date,
): Promise<Leitura | null> => {
  try {
    const post = await completarImagemCarrossel(token, bruto);
    if (!post.caption.trim() && !post.mediaUrl) {
      return null;
    }
    const arquivo = post.mediaUrl ? await baixarImagemEvento(post.mediaUrl) : null;
    const cartaz = await classificarPostInstagram(post.caption, arquivo, agora);
    return cartaz ? {post, cartaz, arquivo} : null;
  } catch (error) {
    if (error instanceof InstagramBloqueadoError || error instanceof GeminiCotaError) {
      throw error;
    }
    log.warn("SugestaoEvento", "Post do Instagram ignorado", {
      id: `ig_${bruto.id}`,
      ...erroDe(error),
    });
    return null;
  }
};

const gravarMidias = async (
  token: string,
  midias: MidiaInstagram[],
): Promise<ResultadoInstagram> => {
  const [ids, eventos] = await Promise.all([
    sugestaoEventoRepository.listarIds(),
    eventoRepository.listarFuturos(),
  ]);
  const conhecidos = new Set(ids);
  const publicados: EventoParaDedupe[] = eventos.map((evento) => ({
    titulo: evento.titulo,
    dataHoraAbertura: evento.dataHoraAbertura,
    linkIngresso: evento.linkIngresso,
    informacoes: evento.informacoes,
  }));
  const agora = new Date();
  const fila = midias
    .filter((post) =>
      !conhecidos.has(`ig_${post.id}`) && post.permalink.startsWith("https://"),
    )
    .sort((a, b) => pesoDoPost(a) - pesoDoPost(b))
    .slice(0, TETO_LEITURAS_INSTAGRAM);
  const leituras: Array<Leitura | null> = [];
  for (const [indice, post] of fila.entries()) {
    if (indice > 0) {
      await pausa(INTERVALO_LEITURA_MS);
    }
    try {
      leituras.push(await lerPost(token, post, agora));
    } catch (error) {
      if (error instanceof GeminiCotaError) {
        break;
      }
      throw error;
    }
  }

  let gravadas = 0;
  for (const leitura of leituras) {
    if (gravadas >= TETO_GRAVACOES_INSTAGRAM) {
      break;
    }
    if (!leitura) {
      continue;
    }
    const {post, cartaz, arquivo} = leitura;
    const id = `ig_${post.id}`;
    try {
      const livres = escolherSugestoesEvento(
        [candidatoDe(post, cartaz)],
        conhecidos,
        publicados,
      );
      if (livres.length === 0) {
        continue;
      }
      const documento = await montar(post, cartaz, arquivo);
      if (!documento) {
        continue;
      }
      const criou = await sugestaoEventoRepository.criar(documento);
      if (criou) {
        gravadas += 1;
        conhecidos.add(id);
      }
    } catch (error) {
      log.warn("SugestaoEvento", "Post do Instagram ignorado", {
        id,
        ...erroDe(error),
      });
    }
  }
  return {
    lidas: midias.length,
    gravadas,
    ignoradas: Math.max(0, midias.length - gravadas),
    bloqueada: false,
  };
};

export const executarRodadaInstagram = async (): Promise<ResultadoInstagram> => {
  const token = (process.env.INSTAGRAM_ACCESS_TOKEN ?? "").trim();
  const chave = (process.env.GEMINI_API_KEY ?? "").trim();
  if (!token || !chave) {
    log.info("SugestaoEvento", "Instagram bloqueado", {
      semToken: !token,
      semGemini: !chave,
    });
    return vazio(true);
  }
  try {
    const midias = await listarMidiasInstagram(token, HASHTAGS_INSTAGRAM);
    const resultado = await gravarMidias(token, midias);
    log.info("SugestaoEvento", "Rodada do Instagram concluída", resultado);
    return resultado;
  } catch (error) {
    if (error instanceof InstagramBloqueadoError) {
      log.info("SugestaoEvento", "Instagram sem permissão", erroDe(error));
      return vazio(true);
    }
    throw error;
  }
};
