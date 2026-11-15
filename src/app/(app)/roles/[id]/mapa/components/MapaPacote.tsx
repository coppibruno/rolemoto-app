"use client";

import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { fonteDoPacote } from "@/lib/mapa-viagem/pacote-mapa";
import { montarMapaOffline, type MapaOffline } from "@/lib/mapa-viagem/mapa-offline";
import type { PontoNomeado } from "@/lib/mapa-viagem/tipos";
import type { Coord } from "@/lib/mapa-viagem/viagem";
import type { Localizacao } from "@/types/role";
import styles from "../mapa.module.css";

type Props = {
  roleId: string;
  pontos: Localizacao[];
  postos: PontoNomeado[];
  cidades: PontoNomeado[];
  posicao: Coord | null;
  aoFalhar: () => void;
};

/** Carregado só via `MapaPacoteSeguro`: MapLibre e pmtiles ficam fora do JS do resto do app. */
export const MapaPacote = ({ roleId, pontos, postos, cidades, posicao, aoFalhar }: Props) => {
  const caixaRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<MapaOffline | null>(null);
  const posicaoRef = useRef(posicao);
  const aoFalharRef = useRef(aoFalhar);
  posicaoRef.current = posicao;
  aoFalharRef.current = aoFalhar;

  useEffect(() => {
    const caixa = caixaRef.current;
    if (!caixa) return;
    let ativo = true;
    let montado: MapaOffline | null = null;
    const falhar = (erro: unknown) => {
      if (!ativo) return;
      console.error(erro);
      aoFalharRef.current();
    };

    const montar = async () => {
      try {
        const fonte = await fonteDoPacote(roleId);
        if (!ativo || !caixaRef.current) return;
        montado = await montarMapaOffline(caixaRef.current, {
          fonte,
          pontos,
          postos,
          cidades,
          aoFalhar: falhar,
        });
        if (!ativo) {
          montado.destruir();
          return;
        }
        montado.atualizarPosicao(posicaoRef.current);
        mapaRef.current = montado;
      } catch (erro) {
        falhar(erro);
      }
    };
    void montar();

    return () => {
      ativo = false;
      try {
        montado?.destruir();
      } catch (erro) {
        console.warn(erro);
      }
      mapaRef.current = null;
    };
  }, [roleId, pontos, postos, cidades]);

  useEffect(() => {
    mapaRef.current?.atualizarPosicao(posicao);
  }, [posicao]);

  return <div ref={caixaRef} className={styles.mapaPacote} aria-label="Mapa offline da viagem" />;
};
