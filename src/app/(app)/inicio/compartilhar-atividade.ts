import { textoConvite, urlConvite, type DadosConvite } from "@/lib/convite";
import { textoConviteEvento, urlConviteEvento } from "@/lib/convite-evento";
import { urlConviteLocal } from "@/lib/convite-local";
import { origemConvite } from "@/lib/origem-convite";
import type { ItemAtividade } from "@/types/atividade";

export type PayloadCompartilharAtividade = {
  title: string;
  text: string;
  url: string;
};

/**
 * Link absoluto do conteúdo do card (estilo Instagram):
 * foto → /perfil/{uid}/fotos/{postId}; telemetria → /telemetria/{id};
 * rolê/evento/local → convite público /r /e /l.
 */
export const urlDiretaAtividade = (item: ItemAtividade): string | null => {
  const origem = origemConvite();
  const alvo = item.alvo;

  if (alvo.tipo === "post") {
    return `${origem}/perfil/${encodeURIComponent(item.autor.uid)}/fotos/${encodeURIComponent(alvo.id)}`;
  }
  if (alvo.tipo === "telemetria") {
    return `${origem}/telemetria/${encodeURIComponent(alvo.id)}`;
  }
  if (alvo.tipo === "role") {
    return urlConvite(alvo.id);
  }
  if (alvo.tipo === "evento") {
    if (item.tipo === "album_evento" && alvo.albumUrl?.trim()) {
      return alvo.albumUrl.trim();
    }
    return urlConviteEvento(alvo.id);
  }
  if (alvo.tipo === "avaliacao") {
    return alvo.alvoTipo === "local"
      ? urlConviteLocal(alvo.alvoId)
      : urlConviteEvento(alvo.alvoId);
  }
  if (alvo.tipo === "local") {
    return urlConviteLocal(alvo.id);
  }
  return null;
};

/** Monta o share do card do Início (foto, telemetria, rolê, evento, avaliação). */
export const payloadCompartilharAtividade = (
  item: ItemAtividade,
): PayloadCompartilharAtividade | null => {
  const url = urlDiretaAtividade(item);
  if (!url) return null;
  const alvo = item.alvo;

  if (alvo.tipo === "role") {
    const dados: DadosConvite = {
      id: alvo.id,
      titulo: alvo.titulo,
      dataHoraSaida: alvo.dataHoraSaida,
      localSaidaEndereco: alvo.saidaNome,
      localSaidaNome: alvo.saidaNome,
    };
    return {
      title: dados.titulo,
      text: textoConvite(dados),
      url,
    };
  }

  if (alvo.tipo === "telemetria") {
    return {
      title: alvo.titulo,
      text: `🏍️ ${alvo.titulo}\n\nAbre o traçado:\n${url}`,
      url,
    };
  }

  if (alvo.tipo === "post") {
    const titulo = `Foto de ${item.autor.apelido}`;
    return {
      title: titulo,
      text: alvo.legenda ? `${alvo.legenda}\n\n${url}` : `${titulo}\n\n${url}`,
      url,
    };
  }

  if (alvo.tipo === "evento") {
    const textoBase = textoConviteEvento({
      id: alvo.id,
      titulo: alvo.titulo,
      dataHoraAbertura: alvo.dataHoraAbertura,
      dataHoraEncerramento: null,
      localNome: alvo.localNome,
      localEndereco: alvo.localNome,
    });
    // Álbum externo: o texto do convite aponta /e/, mas o share deve levar a URL do álbum.
    const text =
      url === urlConviteEvento(alvo.id)
        ? textoBase
        : `🏍️ ${alvo.titulo}\n\nAbre o álbum:\n${url}`;
    return { title: alvo.titulo, text, url };
  }

  if (alvo.tipo === "avaliacao") {
    const onde = alvo.alvoTipo === "local" ? "local" : "evento";
    return {
      title: alvo.alvoNome,
      text: `⭐ Avaliação de ${alvo.alvoNome}\n\nAbre o ${onde}:\n${url}`,
      url,
    };
  }

  if (alvo.tipo === "local") {
    return {
      title: alvo.nome,
      text: `📍 ${alvo.nome}\n\nAbre o local:\n${url}`,
      url,
    };
  }

  return null;
};
