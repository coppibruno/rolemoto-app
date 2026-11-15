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
};

export const MapaPacote = ({ roleId, pontos, postos, cidades, posicao }: Props) => {
  const caixaRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<MapaOffline | null>(null);

  useEffect(() => {
    const caixa = caixaRef.current;
    if (!caixa) return;
    let ativo = true;
    void fonteDoPacote(roleId).then((fonte) => {
      if (!ativo || !caixaRef.current) return;
      const mapa = montarMapaOffline(caixaRef.current, { fonte, pontos, postos, cidades });
      mapa.atualizarPosicao(posicao);
      mapaRef.current = mapa;
    });
    return () => {
      ativo = false;
      mapaRef.current?.destruir();
      mapaRef.current = null;
    };
    // A posição atualiza no efeito de baixo, sem recriar o mapa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId, pontos, postos, cidades]);

  useEffect(() => {
    mapaRef.current?.atualizarPosicao(posicao);
  }, [posicao]);

  return <div ref={caixaRef} className={styles.mapaPacote} aria-label="Mapa offline da viagem" />;
};
