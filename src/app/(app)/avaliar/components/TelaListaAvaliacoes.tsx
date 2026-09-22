"use client";

import type { TipoAlvoAvaliacao } from "@/types/avaliacao-experiencia";
import { CabecalhoFeed } from "@/app/(app)/feed/components/CabecalhoFeed";
import { eventoEncerrado } from "@/lib/countdown-evento";
import type { Evento } from "@/types/evento";
import { useAvaliarExperiencia } from "../hooks/useAvaliarExperiencia";
import { TITULO_PAGINA_LISTA } from "../constants";
import { AcoesListaAvaliacoes } from "./AcoesListaAvaliacoes";
import { CabecalhoAvaliar } from "./CabecalhoAvaliar";
import { CardAlvoAvaliacao } from "./CardAlvoAvaliacao";
import { EstadoCarregando } from "./EstadoCarregando";
import { EstadoErro } from "./EstadoErro";
import { ListaAvaliacoes } from "./ListaAvaliacoes";
import styles from "../avaliar.module.css";

type Props = {
  tipo: TipoAlvoAvaliacao;
  alvoId: string;
};

const podeAvaliarEvento = (
  evento: Evento & { inscrito?: boolean; avaliado?: boolean },
): boolean => {
  if (evento.inscrito !== true) return false;
  return eventoEncerrado(evento.dataHoraAbertura, evento.dataHoraEncerramento);
};

export const TelaListaAvaliacoes = ({ tipo, alvoId }: Props) => {
  const avaliar = useAvaliarExperiencia(tipo, alvoId, "lista");

  const podeAvaliar =
    avaliar.alvo?.tipo === "local"
      ? true
      : avaliar.alvo?.tipo === "evento"
        ? podeAvaliarEvento(avaliar.alvo.dados)
        : false;

  return (
    <div className={styles.tela}>
      <CabecalhoFeed />
      {avaliar.carregando ? <EstadoCarregando /> : null}
      {!avaliar.carregando && avaliar.erro ? (
        <EstadoErro
          titulo={avaliar.erro.titulo}
          corpo={avaliar.erro.corpo}
          onVoltar={avaliar.voltar}
          onTentar={avaliar.erro.podeTentar ? avaliar.recarregar : undefined}
        />
      ) : null}
      {!avaliar.carregando && avaliar.alvo && !avaliar.erro ? (
        <div className={styles.corpo}>
          <CabecalhoAvaliar
            onVoltar={avaliar.voltar}
            titulo={TITULO_PAGINA_LISTA}
          />
          <CardAlvoAvaliacao alvo={avaliar.alvo} />
          <ListaAvaliacoes avaliacoes={avaliar.avaliacoes} uid={avaliar.uid} />
          <AcoesListaAvaliacoes
            tipo={tipo}
            alvoId={alvoId}
            temMinha={Boolean(avaliar.minha)}
            podeAvaliar={podeAvaliar}
            onVoltarFeed={avaliar.voltarAoFeed}
          />
        </div>
      ) : null}
    </div>
  );
};
