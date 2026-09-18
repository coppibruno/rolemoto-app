import type {Evento} from "../types/evento";
import type {
  AutorAvaliacao,
  AvaliacaoExperiencia,
  TipoAlvoAvaliacao,
  UsuarioEventoFeedbackDoc,
  UsuarioLocalFeedbackDoc,
} from "../types/avaliacao-experiencia";
import type {Usuario} from "../types/usuario";

export const LIMITE_COMENTARIO_AVALIACAO = 500;
export const LIMITE_FOTOS_AVALIACAO = 4;
export const LIMITE_LISTA_AVALIACOES = 50;

export type AvaliacaoBodyValidado = {
  nota: number;
  comentario: string;
  fotosUrls: string[];
  recomendaComboio: boolean;
};

export const arredondarNotaMedia = (soma: number, total: number): number => {
  if (total <= 0) {
    return 0;
  }
  return Math.round((soma / total) * 10) / 10;
};

/** Spec 027: now >= (encerramento ?? abertura). */
export const eventoEncerrouParaAvaliacao = (evento: Evento): boolean => {
  const limite = evento.dataHoraEncerramento ?? evento.dataHoraAbertura;
  return Date.parse(limite) <= Date.now();
};

export const validarBodyAvaliacao = (
  body: Record<string, unknown>,
): {ok: true; dados: AvaliacaoBodyValidado} | {ok: false; erro: string} => {
  const nota = body.nota;
  if (
    typeof nota !== "number" ||
    !Number.isInteger(nota) ||
    nota < 1 ||
    nota > 5
  ) {
    return {ok: false, erro: "nota é obrigatória"};
  }

  const comentarioBruto = body.comentario;
  if (
    comentarioBruto !== undefined &&
    comentarioBruto !== null &&
    typeof comentarioBruto !== "string"
  ) {
    return {ok: false, erro: "comentario inválido"};
  }
  const comentario =
    typeof comentarioBruto === "string" ? comentarioBruto.trim() : "";
  if (comentario.length > LIMITE_COMENTARIO_AVALIACAO) {
    return {ok: false, erro: "comentario excede 500 caracteres"};
  }

  let fotosUrls: string[] = [];
  if (body.fotosUrls !== undefined && body.fotosUrls !== null) {
    if (!Array.isArray(body.fotosUrls)) {
      return {ok: false, erro: "fotosUrls inválidas"};
    }
    if (body.fotosUrls.length > LIMITE_FOTOS_AVALIACAO) {
      return {ok: false, erro: "fotosUrls excede 4 itens"};
    }
    const unicos = new Set<string>();
    for (const item of body.fotosUrls) {
      if (typeof item !== "string" || !item.trim()) {
        return {ok: false, erro: "fotosUrls inválidas"};
      }
      const url = item.trim();
      if (unicos.has(url)) {
        return {ok: false, erro: "fotosUrls inválidas"};
      }
      unicos.add(url);
      fotosUrls = [...fotosUrls, url];
    }
  }

  if (typeof body.recomendaComboio !== "boolean") {
    return {ok: false, erro: "recomendaComboio inválido"};
  }

  return {
    ok: true,
    dados: {
      nota,
      comentario,
      fotosUrls,
      recomendaComboio: body.recomendaComboio,
    },
  };
};

export const fallbackAutorAvaliacao = (uid: string): AutorAvaliacao => ({
  uid,
  nome: "Piloto",
  apelido: "piloto",
  fotoUrl: "",
});

export const hidratarAvaliacaoLocal = (
  doc: UsuarioLocalFeedbackDoc,
  usuario: Usuario | undefined,
): AvaliacaoExperiencia => ({
  id: doc.id,
  usuarioId: doc.usuarioId,
  alvoTipo: "local",
  alvoId: doc.localId,
  nota: doc.nota,
  comentario: doc.comentario,
  fotosUrls: doc.fotosUrls,
  recomendaComboio: doc.recomendaComboio,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
  autor: usuario ?
    {
      uid: usuario.uid,
      nome: usuario.nome,
      apelido: usuario.apelido,
      fotoUrl: usuario.fotoUrl,
    } :
    fallbackAutorAvaliacao(doc.usuarioId),
});

export const hidratarAvaliacaoEvento = (
  doc: UsuarioEventoFeedbackDoc,
  usuario: Usuario | undefined,
): AvaliacaoExperiencia => ({
  id: doc.id,
  usuarioId: doc.usuarioId,
  alvoTipo: "evento",
  alvoId: doc.eventoId,
  nota: doc.nota,
  comentario: doc.comentario,
  fotosUrls: doc.fotosUrls,
  recomendaComboio: doc.recomendaComboio,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
  autor: usuario ?
    {
      uid: usuario.uid,
      nome: usuario.nome,
      apelido: usuario.apelido,
      fotoUrl: usuario.fotoUrl,
    } :
    fallbackAutorAvaliacao(doc.usuarioId),
});

export const idFeedbackAlvo = (
  usuarioId: string,
  alvoId: string,
): string => `${usuarioId}_${alvoId}`;

export type {TipoAlvoAvaliacao};
