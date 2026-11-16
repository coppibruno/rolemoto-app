import {apelidoExibicao} from "./apelido";
import {idAtividade} from "./atividade";
import {adminStorage} from "./firebase-admin";
import {erroDe, log} from "./log";
import {encaminhadoPor} from "./story-local";
import {
  atividadeRepository,
  eventoRepository,
  localRepository,
  postFotoRepository,
  usuarioRepository,
} from "../repositories";
import type {
  AutorPost,
  ComentarioPost,
  ComentarioPublico,
  DetalhePost,
  ItemGradePost,
  MarcaPost,
  PostFoto,
} from "../types/post-foto";
import type {Usuario} from "../types/usuario";

const autorDe = (uid: string, usuario: Usuario | null | undefined): AutorPost => ({
  uid,
  apelido: apelidoExibicao(usuario),
  fotoUrl: usuario?.fotoUrl ?? "",
});

export const nomeDaMarca = async (marca: MarcaPost): Promise<string | null> => {
  if (marca.tipo === "local") {
    return (await localRepository.buscarPorId(marca.id))?.nome ?? null;
  }
  return (await eventoRepository.buscarPorId(marca.id))?.titulo ?? null;
};

export const paraItemGrade = (post: PostFoto): ItemGradePost => ({
  id: post.id,
  fotoUrl: post.fotoUrl,
  createdAt: post.createdAt,
});

/** Mesma curtida do card no Início (`foto_{postId}`). Falha lê como sem curtida. */
const curtidaDoPost = async (
  postId: string,
  tokenUid: string,
): Promise<{curtidoPorMim: boolean; totalCurtidas: number}> => {
  try {
    const id = idAtividade("foto", [postId]);
    const [atividade, curtidas] = await Promise.all([
      atividadeRepository.buscarPorId(id),
      atividadeRepository.curtidasDe(tokenUid, [id]),
    ]);
    return {curtidoPorMim: curtidas.has(id), totalCurtidas: atividade?.totalCurtidas ?? 0};
  } catch (error) {
    log.warn("PostFoto", "Curtida do post indisponível", {postId, ...erroDe(error)});
    return {curtidoPorMim: false, totalCurtidas: 0};
  }
};

export const paraDetalhe = async (
  post: PostFoto,
  tokenUid: string,
  encaminhado?: boolean,
): Promise<DetalhePost> => {
  const marca = post.marcaTipo && post.marcaId ?
    {tipo: post.marcaTipo, id: post.marcaId} :
    null;
  const [usuario, nome, encaminhadoPorMim, curtida] = await Promise.all([
    usuarioRepository.buscarPorId(post.usuarioId),
    marca ? nomeDaMarca(marca) : Promise.resolve(null),
    encaminhado ?? encaminhadoPor(tokenUid, post.id),
    curtidaDoPost(post.id, tokenUid),
  ]);
  return {
    id: post.id,
    fotoUrl: post.fotoUrl,
    legenda: post.legenda,
    marca: marca && nome ? {...marca, nome} : null,
    totalComentarios: post.totalComentarios,
    createdAt: post.createdAt,
    encaminhadoPorMim,
    curtidoPorMim: curtida.curtidoPorMim,
    totalCurtidas: curtida.totalCurtidas,
    autor: autorDe(post.usuarioId, usuario),
  };
};

export const paraComentarios = async (
  comentarios: ComentarioPost[],
  post: PostFoto,
  tokenUid: string,
): Promise<ComentarioPublico[]> => {
  const usuarios = await usuarioRepository.buscarPorIds(
    [...new Set(comentarios.map((item) => item.usuarioId))],
  );
  const porUid = new Map(usuarios.map((usuario) => [usuario.uid, usuario]));
  return comentarios.map((item) => ({
    id: item.id,
    texto: item.texto,
    createdAt: item.createdAt,
    podeApagar: tokenUid === item.usuarioId || tokenUid === post.usuarioId,
    autor: autorDe(item.usuarioId, porUid.get(item.usuarioId)),
  }));
};

export const apagarArquivoPost = async (storagePath: string): Promise<void> => {
  if (!storagePath) {
    return;
  }
  try {
    await adminStorage.bucket().file(storagePath).delete({ignoreNotFound: true});
  } catch (error) {
    log.warn("PostFoto", "Falha ao apagar arquivo", {storagePath, ...erroDe(error)});
  }
};

export const apagarPostsDoUsuario = async (uid: string): Promise<void> => {
  const caminhos = await postFotoRepository.limparPorUsuario(uid);
  for (const caminho of caminhos) {
    await apagarArquivoPost(caminho);
  }
};
