import type { ItemAtividade } from "@/types/atividade";
import { LIMITE_NOVIDADES_EXIBIDO } from "./constants";

const TZ = "America/Sao_Paulo";
const MIN = 60 * 1000;
const HORA = 60 * MIN;
const DIA = 24 * HORA;

const ymd = (data: Date): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(data);

/** “agora”, “há 12 min”, “há 3 h”, “ontem”, “há 4 dias” e data curta depois de 7 dias. */
export const tempoRelativo = (iso: string, agora = new Date()): string => {
  const data = new Date(iso);
  const diff = agora.getTime() - data.getTime();
  if (!Number.isFinite(diff) || diff < MIN) return "agora";
  if (diff < HORA) return `há ${Math.floor(diff / MIN)} min`;
  const ontem = ymd(new Date(agora.getTime() - DIA)) === ymd(data);
  if (diff < DIA && !ontem) return `há ${Math.floor(diff / HORA)} h`;
  if (ontem) return "ontem";
  if (diff < 7 * DIA) return `há ${Math.max(2, Math.floor(diff / DIA))} dias`;
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "numeric", month: "short" })
    .format(data)
    .replace(".", "");
};

export const dataHoraCurta = (iso: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(new Date(iso))
    .replace(/\./g, "");

export const rotuloNovidades = (total: number): string => {
  if (total >= LIMITE_NOVIDADES_EXIBIDO) return `${LIMITE_NOVIDADES_EXIBIDO}+ novidades`;
  return total === 1 ? "1 novidade" : `${total} novidades`;
};

export const verboConteudo = (item: ItemAtividade): string => {
  switch (item.tipo) {
    case "foto":
      return "postou uma foto";
    case "telemetria":
      return "gravou um rolê";
    case "role_criado":
      return "criou um rolê";
    case "role_realizado":
      return "liderou um rolê";
    case "avaliacao_local":
    case "avaliacao_evento":
      return item.alvo.tipo === "avaliacao" ? `avaliou ${item.alvo.alvoNome}` : "avaliou";
    case "album_evento":
      return item.alvo.tipo === "evento"
        ? `publicou as fotos de ${item.alvo.titulo}`
        : "publicou as fotos do evento";
    default:
      return "";
  }
};

export const hrefPerfil = (uid: string, tokenUid: string | undefined): string =>
  uid === tokenUid ? "/perfil" : `/perfil/${encodeURIComponent(uid)}`;

/** Ficha do alvo, aberta pelo toque no card ou na linha. */
export const hrefAlvo = (item: ItemAtividade): string => {
  const alvo = item.alvo;
  switch (alvo.tipo) {
    case "post":
      return `/perfil/${encodeURIComponent(item.autor.uid)}/fotos/${encodeURIComponent(alvo.id)}`;
    case "telemetria":
      return `/telemetria/${encodeURIComponent(alvo.id)}`;
    case "role":
      return `/roles/${encodeURIComponent(alvo.id)}`;
    case "evento":
      return item.tipo === "album_evento"
        ? `/eventos/${encodeURIComponent(alvo.id)}?album=1`
        : `/eventos/${encodeURIComponent(alvo.id)}`;
    case "avaliacao":
      return alvo.alvoTipo === "local"
        ? `/locais/${encodeURIComponent(alvo.alvoId)}`
        : `/eventos/${encodeURIComponent(alvo.alvoId)}`;
    case "local":
      return `/locais/${encodeURIComponent(alvo.id)}`;
  }
};

export type CtaAtividade = { rotulo: string; href: string };

/** CTA do card ou da linha; o fluxo de entrar ou se inscrever fica na ficha. */
export const ctaDoItem = (item: ItemAtividade): CtaAtividade | null => {
  const alvo = item.alvo;
  const href = hrefAlvo(item);
  switch (item.tipo) {
    case "telemetria":
      return { rotulo: "Ver traçado", href };
    case "role_realizado":
      return { rotulo: "Ver rolê", href };
    case "avaliacao_local":
      return { rotulo: "Ver local", href };
    case "avaliacao_evento":
      return { rotulo: "Ver evento", href };
    case "album_evento":
      return { rotulo: "Ver álbum", href };
    case "role_criado":
    case "entrada_role":
      if (alvo.tipo !== "role" || alvo.jaSaiu || alvo.minhaParticipacao !== "nenhuma") {
        return null;
      }
      return { rotulo: "Quero ir", href };
    case "inscricao_evento":
      if (alvo.tipo !== "evento" || alvo.encerrado || alvo.inscrito) return null;
      return { rotulo: "Eu também vou", href };
    default:
      return null;
  }
};

/** “Ana”, “Ana, Bruno” ou “Ana, Bruno e mais 2”. */
export const nomesDoGrupo = (item: ItemAtividade): { nomes: string; extra: string } => {
  const nomes = [item.autor, ...item.outrosAutores].map((a) => a.apelido).join(", ");
  const resto = item.totalAutores - 1 - item.outrosAutores.length;
  return { nomes, extra: resto > 0 ? ` e mais ${resto}` : "" };
};

export const verboLinha = (item: ItemAtividade): string => {
  const grupo = item.totalAutores > 1;
  if (item.tipo === "entrada_role") return grupo ? "vão no rolê" : "vai no rolê";
  if (item.tipo === "inscricao_evento") return grupo ? "se inscreveram em" : "se inscreveu em";
  return "ganhou o selo";
};

export const tituloLinha = (item: ItemAtividade): string => {
  const alvo = item.alvo;
  if (alvo.tipo === "role" || alvo.tipo === "evento") return alvo.titulo;
  if (alvo.tipo === "local") return alvo.nome;
  return "";
};

export const dataDoAlvo = (item: ItemAtividade): string | null => {
  const alvo = item.alvo;
  if (alvo.tipo === "role") return dataHoraCurta(alvo.dataHoraSaida);
  if (alvo.tipo === "evento") return dataHoraCurta(alvo.dataHoraAbertura);
  return null;
};
