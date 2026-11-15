"use client";

import { useState } from "react";
import { ERRO_FORA_DO_SUL, pontoEstaNoSul } from "@/lib/regiao-sul";
import type { Localizacao } from "@/types/role";
import { ENDERECO_MIN, PLACEHOLDER_NOME_PARADA, PLACEHOLDER_PARADA } from "../constants";
import { useCampoLocalizacao } from "../hooks/useCampoLocalizacao";
import { CampoLocalizacao } from "./CampoLocalizacao";
import styles from "../criar-role.module.css";

type Props = {
  numero: number;
  onIncluir: (ponto: Localizacao) => void;
  onCancelar: () => void;
};

export const EditorParada = ({ numero, onIncluir, onCancelar }: Props) => {
  const campo = useCampoLocalizacao();
  const [mapaAberto, setMapaAberto] = useState(false);
  const [erro, setErro] = useState<string | undefined>();

  const incluir = async () => {
    const ponto = await campo.resolverPontoPendente();
    if (ponto.endereco.trim().length < ENDERECO_MIN) {
      setErro("Informe o ponto da parada");
      return;
    }
    if (ponto.lat == null || ponto.lng == null) {
      setErro("Escolha um endereço da lista, toque no mapa ou use o GPS");
      return;
    }
    if (!pontoEstaNoSul(ponto.lat, ponto.lng)) {
      setErro(ERRO_FORA_DO_SUL);
      return;
    }
    onIncluir({
      lat: ponto.lat,
      lng: ponto.lng,
      endereco: ponto.endereco.trim(),
      nome: ponto.nome.trim(),
    });
  };

  return (
    <div className={styles.editorParada}>
      <CampoLocalizacao
        id={`parada-${numero}`}
        label={`Parada ${numero}`}
        icone="pin_drop"
        placeholder={PLACEHOLDER_PARADA}
        placeholderNome={PLACEHOLDER_NOME_PARADA}
        mostrarGps
        campo={campo}
        erro={erro}
        mapaAberto={mapaAberto}
        onAlternarMapa={() => setMapaAberto((aberto) => !aberto)}
        onPontoDefinido={() => {
          setErro(undefined);
          setMapaAberto(true);
        }}
      />
      <div className={styles.editorParadaAcoes}>
        <button type="button" className={styles.botaoIncluirParada} onClick={() => void incluir()}>
          Incluir parada
        </button>
        <button type="button" className={styles.botaoMapa} onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  );
};
