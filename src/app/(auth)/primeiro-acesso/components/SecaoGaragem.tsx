"use client";

import { SeletorTipoMoto } from "@/components/perfil/SeletorTipoMoto";
import type { TipoMoto } from "@/types/user";
import { COPY } from "../constants";
import { CampoTexto } from "./CampoTexto";
import { ToggleGarupa } from "./ToggleGarupa";
import styles from "../primeiro-acesso.module.css";

type Props = {
  moto: string;
  tipoMoto: TipoMoto | null;
  garupaFrequente: boolean;
  onMoto: (valor: string) => void;
  onTipoMoto: (valor: TipoMoto) => void;
  onGarupa: (valor: boolean) => void;
  erroMoto?: string;
  erroTipoMoto?: string;
  desabilitado?: boolean;
};

export const SecaoGaragem = ({
  moto,
  tipoMoto,
  garupaFrequente,
  onMoto,
  onTipoMoto,
  onGarupa,
  erroMoto,
  erroTipoMoto,
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
      <SeletorTipoMoto
        valor={tipoMoto}
        onChange={onTipoMoto}
        erro={erroTipoMoto}
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
