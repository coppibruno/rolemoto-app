"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { MapaLeitura } from "@/components/maps/MapaLeitura";
import { formatarDataMeta } from "@/app/(app)/perfil/formatar-data-historico";
import { formatarHora } from "@/app/(app)/feed/formatar-horario";
import { urlViagemMaps } from "@/lib/maps";
import { lugaresDoPacote, planoDaViagem } from "@/lib/mapa-viagem/lista-viagem";
import type { MetaPacote } from "@/lib/mapa-viagem/tipos";
import { formatarDistanciaKm, formatarMegabytes } from "@/lib/mapa-viagem/viagem";
import {
  ATRIBUICAO,
  CONFIRMAR_APAGAR,
  CTA_APAGAR,
  CTA_ATUALIZAR,
  CTA_BAIXANDO,
  CTA_BAIXAR,
  FAIXA_ROTA_MUDOU,
  ROTULO_NESTE_CELULAR,
  TEXTO_FALHA_PACOTE,
  TEXTO_NAVEGADOR,
  TEXTO_ROTA_MUDOU,
  TEXTO_SEM_GPS,
  TITULO_LUGARES,
  TITULO_PLANO,
  TITULO_TELA,
  confirmarTamanho,
} from "../constants";
import { useDetalheMapa } from "../hooks/useDetalheMapa";
import { usePacoteMapa } from "../hooks/usePacoteMapa";
import { usePosicaoViagem } from "../hooks/usePosicaoViagem";
import { MapaPacoteSeguro } from "./MapaPacoteSeguro";
import styles from "../mapa.module.css";

type Props = {
  roleId: string;
};

const COR_SAIDA = "#7CFF6B";
const COR_PARADA = "#FF6B00";
const COR_DESTINO = "#7DD3E8";
const COR_VOCE = "#4FC3F7";

export const TelaMapaViagem = ({ roleId }: Props) => {
  const router = useRouter();
  const { detalhe, viagem, podeBaixar, erro, carregando, recarregar } = useDetalheMapa(roleId);
  const pacote = usePacoteMapa(viagem);
  const { posicao, negado } = usePosicaoViagem();
  const meta: MetaPacote | null =
    pacote.estado.tipo === "atual" || pacote.estado.tipo === "desatualizado"
      ? pacote.estado.meta
      : null;
  // Guarda o `baixadoEm` do pacote que falhou: baixar de novo tenta o desenho outra vez.
  const [pacoteQueFalhou, setPacoteQueFalhou] = useState<string | null>(null);
  const falhouPacote = meta !== null && pacoteQueFalhou === meta.baixadoEm;
  const marcarFalha = useCallback(() => setPacoteQueFalhou(meta?.baixadoEm ?? null), [meta]);
  const pontos = viagem?.pontos ?? [];
  const plano = planoDaViagem(pontos, posicao);
  const lugares = meta ? lugaresDoPacote(meta.postos, meta.cidades, posicao) : [];

  const voltar = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  return (
    <div className={styles.tela}>
      <header className={styles.cabecalho}>
        <button type="button" className={styles.botaoVoltar} aria-label="Voltar" onClick={voltar}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className={styles.titulo}>{TITULO_TELA}</h1>
        <span className={styles.espaco} aria-hidden />
      </header>

      {carregando ? <p className={styles.aviso}>Carregando…</p> : null}
      {erro ? (
        <div className={styles.erro}>
          <p>{erro}</p>
          <button type="button" onClick={recarregar}>
            Tentar de novo
          </button>
        </div>
      ) : null}

      {detalhe && viagem ? (
        <>
          <div className={styles.resumo}>
            <h2 className={styles.tituloRole}>{detalhe.titulo}</h2>
            <p className={styles.data}>
              {formatarDataMeta(detalhe.dataHoraSaida)} · {formatarHora(detalhe.dataHoraSaida)}
            </p>
          </div>

          <div className={styles.mapaCaixa}>
            {meta && !falhouPacote ? (
              <MapaPacoteSeguro
                key={meta.baixadoEm}
                roleId={roleId}
                pontos={pontos}
                postos={meta.postos}
                cidades={meta.cidades}
                posicao={posicao}
                aoFalhar={marcarFalha}
              />
            ) : (
              <MapaLeitura
                className={styles.mapaOnline}
                aria-label="Mapa da viagem"
                trajeto={pontos}
                marcadores={[
                  ...pontos.map((ponto, indice) => ({
                    lat: ponto.lat,
                    lng: ponto.lng,
                    cor: indice === 0 ? COR_SAIDA : indice === pontos.length - 1 ? COR_DESTINO : COR_PARADA,
                    rotulo: indice === 0 ? "S" : indice === pontos.length - 1 ? "D" : String(indice),
                    nomeAcessivel: ponto.nome || ponto.endereco,
                  })),
                  ...(posicao
                    ? [{ lat: posicao.lat, lng: posicao.lng, cor: COR_VOCE, rotulo: "Você" }]
                    : []),
                ]}
              />
            )}
          </div>
          <p className={styles.atribuicao}>{ATRIBUICAO}</p>
          {falhouPacote ? (
            <p className={styles.erroTexto} role="alert">
              {TEXTO_FALHA_PACOTE}
            </p>
          ) : null}

          <a
            className={styles.linkMaps}
            href={urlViagemMaps(pontos)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="material-symbols-outlined" aria-hidden>
              navigation
            </span>
            Abrir no Maps
          </a>

          {negado ? <p className={styles.aviso}>{TEXTO_SEM_GPS}</p> : null}
          <AcoesPacote podeBaixar={podeBaixar} pacote={pacote} />
          {pacote.erro ? (
            <p className={styles.erroTexto} role="alert">
              {pacote.erro}
            </p>
          ) : null}

          <Lista titulo={TITULO_PLANO} itens={plano} />
          {lugares.length > 0 ? <Lista titulo={TITULO_LUGARES} itens={lugares} /> : null}
        </>
      ) : null}
    </div>
  );
};

type AcoesProps = {
  podeBaixar: boolean;
  pacote: ReturnType<typeof usePacoteMapa>;
};

const AcoesPacote = ({ podeBaixar, pacote }: AcoesProps) => {
  const { estado, estimativa, confirmacao } = pacote;

  if (estado.tipo === "indisponivel") {
    return <p className={styles.aviso}>{TEXTO_NAVEGADOR}</p>;
  }
  if (!podeBaixar || estado.tipo === "sem-url" || estado.tipo === "carregando") return null;

  return (
    <div className={styles.acoes}>
      {estado.tipo === "desatualizado" ? (
        <div className={styles.faixa}>
          <span className={styles.faixaTitulo}>{FAIXA_ROTA_MUDOU}</span>
          <span>{TEXTO_ROTA_MUDOU}</span>
        </div>
      ) : null}

      {estado.tipo === "atual" ? <p className={styles.aviso}>{ROTULO_NESTE_CELULAR}</p> : null}

      {estado.tipo === "ausente" || estado.tipo === "desatualizado" ? (
        <button type="button" className={styles.cta} onClick={pacote.baixar}>
          {estado.tipo === "desatualizado" ? CTA_ATUALIZAR : CTA_BAIXAR}
          <span className={styles.tamanho}>{formatarMegabytes(estimativa)}</span>
        </button>
      ) : null}

      {estado.tipo === "baixando" ? (
        <button type="button" className={styles.cta} disabled>
          {CTA_BAIXANDO} {Math.round(estado.fracao * 100)}%
        </button>
      ) : null}

      {estado.tipo === "atual" ? (
        <button type="button" className={styles.secundario} onClick={pacote.apagar}>
          {CTA_APAGAR}
        </button>
      ) : null}

      {confirmacao === "tamanho" ? (
        <div className={styles.confirma}>
          <p>{confirmarTamanho(formatarMegabytes(estimativa))}</p>
          <button type="button" className={styles.cta} onClick={pacote.confirmarTamanho}>
            Baixar agora
          </button>
          <button type="button" className={styles.secundario} onClick={pacote.cancelarConfirmacao}>
            Agora não
          </button>
        </div>
      ) : null}

      {confirmacao === "apagar" ? (
        <div className={styles.confirma}>
          <p>{CONFIRMAR_APAGAR}</p>
          <button type="button" className={styles.secundario} onClick={pacote.apagar}>
            Apagar
          </button>
          <button type="button" className={styles.cta} onClick={pacote.cancelarConfirmacao}>
            Manter
          </button>
        </div>
      ) : null}
    </div>
  );
};

const Lista = ({
  titulo,
  itens,
}: {
  titulo: string;
  itens: { chave: string; marca: string; titulo: string; subtitulo: string; distanciaKm: number | null }[];
}) => (
  <section className={styles.listaBloco}>
    <h3 className={styles.listaTitulo}>{titulo}</h3>
    <ol className={styles.lista}>
      {itens.map((item) => (
        <li key={item.chave} className={styles.item}>
          {item.marca ? <span className={styles.marca}>{item.marca}</span> : null}
          <span className={styles.itemTextos}>
            <span className={styles.itemTitulo}>{item.titulo}</span>
            <span className={styles.itemSub}>{item.subtitulo}</span>
          </span>
          {item.distanciaKm !== null ? (
            <span className={styles.distancia}>{formatarDistanciaKm(item.distanciaKm)}</span>
          ) : null}
        </li>
      ))}
    </ol>
  </section>
);
