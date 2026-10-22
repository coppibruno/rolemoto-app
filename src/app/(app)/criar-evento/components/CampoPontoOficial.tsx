"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import styles from "../criar-evento.module.css";

type PontoCatalogo = {
  id: string;
  nome: string;
  endereco: string;
  lat: number;
  lng: number;
};

const HINT =
  "Se este encontro é num ponto do catálogo, as fotos ficam no mesmo rolo desse ponto. Se não for, o encontro tem as fotos dele.";

type Props = {
  valor: string | null;
  onChange: (ponto: PontoCatalogo | null) => void;
  desabilitado?: boolean;
};

export const CampoPontoOficial = ({ valor, onChange, desabilitado }: Props) => {
  const [pontos, setPontos] = useState<PontoCatalogo[]>([]);

  useEffect(() => {
    let cancelado = false;
    api<PontoCatalogo[]>("/locais")
      .then((lista) => {
        if (!cancelado) setPontos(lista);
      })
      .catch(() => {
        if (!cancelado) setPontos([]);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <div className={styles.campo}>
      <label htmlFor="ponto-oficial" className={styles.label}>
        Ponto oficial
      </label>
      <select
        id="ponto-oficial"
        className={styles.select}
        value={valor ?? ""}
        disabled={desabilitado}
        onChange={(e) => {
          const id = e.target.value;
          if (!id) {
            onChange(null);
            return;
          }
          onChange(pontos.find((ponto) => ponto.id === id) ?? null);
        }}
      >
        <option value="">Nenhum</option>
        {pontos.map((ponto) => (
          <option key={ponto.id} value={ponto.id}>
            {ponto.nome}
          </option>
        ))}
      </select>
      <p className={styles.hintStory}>{HINT}</p>
    </div>
  );
};
