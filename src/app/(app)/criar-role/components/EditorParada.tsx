"use client";

import { useEffect, useRef, useState } from "react";
import type { Localizacao } from "@/types/role";
import { PLACEHOLDER_NOME_PARADA, PLACEHOLDER_PARADA } from "../constants";
import { useCampoLocalizacao } from "../hooks/useCampoLocalizacao";
import { paradaDoSeletor } from "../paradas";
import { CampoLocalizacao } from "./CampoLocalizacao";
import styles from "../criar-role.module.css";

type Props = {
  numero: number;
  onIncluir: (ponto: Localizacao) => void;
  onCancelar: () => void;
};

/** Seletor da parada: o primeiro ponto válido (busca, mapa ou GPS) já entra na lista. */
export const EditorParada = ({ numero, onIncluir, onCancelar }: Props) => {
  const campo = useCampoLocalizacao();
  const [mapaAberto, setMapaAberto] = useState(false);
  const incluidaRef = useRef(false);
  const parada = paradaDoSeletor(campo.valor, campo.resolvendoEndereco);

  useEffect(() => {
    if (!parada || incluidaRef.current) return;
    incluidaRef.current = true;
    onIncluir(parada);
  }, [parada, onIncluir]);

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
        mapaAberto={mapaAberto}
        onAlternarMapa={() => setMapaAberto((aberto) => !aberto)}
        onPontoDefinido={() => undefined}
      />
      <button type="button" className={styles.botaoMapa} onClick={onCancelar}>
        Cancelar
      </button>
    </div>
  );
};
