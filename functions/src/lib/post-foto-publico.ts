import {apelidoExibicao} from "./apelido";
import {adminStorage} from "./firebase-admin";
import {erroDe, log} from "./log";
import {encaminhadoPor} from "./story-local";
import {
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

export const paraDetalhe = async (
  post: PostFoto,
  tokenUid: string,
  encaminhado?: boolean,
): Promise<DetalhePost> => {
  const marca = post.marcaTipo && post.marcaId ?
    {tipo: post.marcaTipo, id: post.marcaId} :
    null;
  const [usuario, nome, encaminhadoPorMim] = await Promise.all([
    usuarioRepository.buscarPorId(post.usuarioId),
    marca ? nomeDaMarca(marca) : Promise.resolve(null),
    encaminhado ?? encaminhadoPor(tokenUid, post.id),
  ]);
  return {
    id: post.id,
    fotoUrl: post.fotoUrl,
    legenda: post.legenda,
    marca: marca && nome ? {...marca, nome} : null,
    totalComentarios: post.totalComentarios,
    createdAt: post.createdAt,
    encaminhadoPorMim,
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
