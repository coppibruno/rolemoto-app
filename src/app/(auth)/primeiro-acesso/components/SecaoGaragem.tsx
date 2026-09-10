"use client";

import { COPY } from "../constants";
import { CampoTexto } from "./CampoTexto";
import { ToggleGarupa } from "./ToggleGarupa";
import styles from "../primeiro-acesso.module.css";

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
    <section className={styles.card}>
      <div className={styles.secaoCabecalho}>
        <div className={styles.secaoTitulo}>
          <span className="material-symbols-outlined" aria-hidden>
            garage
          </span>
          {COPY.garagemTitulo}
        </div>
        <span className={styles.badgeMoto}>{COPY.badgeMoto}</span>
      </div>
      <CampoTexto
        id="moto"
        label={COPY.motoLabel}
        icone="motorcycle"
        placeholder={COPY.motoPlaceholder}
        valor={moto}
        onChange={onMoto}
        erro={erroMoto}
        desabilitado={desabilitado}
      />
      <div className={styles.garupaLinha}>
        <div className={styles.garupaTextos}>
          <span className={styles.garupaLabel}>{COPY.garupaLabel}</span>
          <span className={styles.garupaHint}>{COPY.garupaHint}</span>
        </div>
        <ToggleGarupa
          valor={garupaFrequente}
          onChange={onGarupa}
          desabilitado={desabilitado}
        />
      </div>
    </section>
  );
};
