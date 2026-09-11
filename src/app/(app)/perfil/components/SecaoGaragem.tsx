"use client";

import { CampoTexto } from "./CampoTexto";
import { ToggleGarupa } from "./ToggleGarupa";
import styles from "../perfil.module.css";

type Props = {
  moto: string;
  garupaFrequente: boolean;
  onMoto: (valor: string) => void;
  onGarupa: (valor: boolean) => void;
  erroMoto?: string;
  desabilitado?: boolean;
};

export const SecaoGaragem = ({
  moto,
  garupaFrequente,
  onMoto,
  onGarupa,
  erroMoto,
  desabilitado,
}: Props) => {
  return (
    <>
      <div className={styles.secaoCabecalho}>
        <span className={styles.secaoBarra} />
        <h2 className={styles.secaoTitulo}>Garagem</h2>
      </div>
      <CampoTexto
        id="moto"
        label="Modelo • Cilindrada • Ano"
        hint="obrigatório"
        hintDestaque
        icone="motorcycle"
        placeholder="Ex: Honda CB 650R 2022"
        valor={moto}
        onChange={onMoto}
        erro={erroMoto}
        desabilitado={desabilitado}
      />
      <div className={styles.garupaLinha}>
        <div className={styles.garupaTextos}>
          <span className={styles.garupaLabel}>Possui Garupa Frequente?</span>
          <span className={styles.garupaHint}>
            Os líderes consideram isso na logística do comboio.
          </span>
        </div>
        <ToggleGarupa
          valor={garupaFrequente}
          onChange={onGarupa}
          desabilitado={desabilitado}
        />
      </div>
    </>
  );
};
