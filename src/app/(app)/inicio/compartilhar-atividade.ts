import { textoConvite, urlConvite, type DadosConvite } from "@/lib/convite";
import { textoConviteEvento, urlConviteEvento } from "@/lib/convite-evento";
import { origemConvite } from "@/lib/origem-convite";
import type { ItemAtividade } from "@/types/atividade";

export type PayloadCompartilharAtividade = {
  title: string;
  text: string;
  url: string;
};

/** Monta o share do card do Início (rolê, telemetria, foto, álbum). */
export const payloadCompartilharAtividade = (
  item: ItemAtividade,
): PayloadCompartilharAtividade | null => {
  const origem = origemConvite();
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
      url: urlConvite(dados.id),
    };
  }

  if (alvo.tipo === "telemetria") {
    const url = `${origem}/telemetria/${encodeURIComponent(alvo.id)}`;
    return {
      title: alvo.titulo,
      text: `🏍️ ${alvo.titulo}\n\nAbre o traçado:\n${url}`,
      url,
    };
  }

  if (alvo.tipo === "post") {
    const url = `${origem}/perfil/${encodeURIComponent(item.autor.uid)}/fotos/${encodeURIComponent(alvo.id)}`;
    return {
      title: `Foto de ${item.autor.apelido}`,
      text: alvo.legenda
        ? `${alvo.legenda}\n\n${url}`
        : `Foto de ${item.autor.apelido}\n\n${url}`,
      url,
    };
  }

  if (alvo.tipo === "evento") {
    const url =
      item.tipo === "album_evento" && alvo.albumUrl?.trim()
        ? alvo.albumUrl.trim()
        : urlConviteEvento(alvo.id);
    return {
      title: alvo.titulo,
      text: textoConviteEvento({
        id: alvo.id,
        titulo: alvo.titulo,
        dataHoraAbertura: alvo.dataHoraAbertura,
        dataHoraEncerramento: null,
        localNome: alvo.localNome,
        localEndereco: alvo.localNome,
      }),
      url,
    };
  }

  return null;
};
