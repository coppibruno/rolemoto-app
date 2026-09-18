"use client";

import { PLACEHOLDER_LINK_MAPS } from "../constants";
import styles from "../criar-local.module.css";

type Props = {
  valor: string;
  onChange: (valor: string) => void;
  erro?: string;
  desabilitado?: boolean;
};

export const CampoLinkMaps = ({ valor, onChange, erro, desabilitado }: Props) => {
  const erroId = "link-maps-erro";

  return (
    <div className={`${styles.cartao} ${erro ? styles.cartaoErro : ""}`}>
      <label htmlFor="maps-ref" className={`${styles.label} ${styles.labelOpcional}`}>
        Ponto de Referência / Link do Google Maps (Opcional)
      </label>
      <div className={styles.campoIcone}>
        <span className={`material-symbols-outlined ${styles.iconeInput}`} aria-hidden>
          share_location
        </span>
        <input
          id="maps-ref"
          type="url"
          className={`${styles.input} ${erro ? styles.inputErro : ""}`}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={PLACEHOLDER_LINK_MAPS}
          disabled={desabilitado}
          autoComplete="off"
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? erroId : undefined}
        />
      </div>
      {erro ? (
        <p id={erroId} className={styles.erroCampo} role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
};
