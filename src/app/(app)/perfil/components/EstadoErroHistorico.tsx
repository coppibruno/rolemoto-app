"use client";

import styles from "../historico-pistas.module.css";

type Props = {
  mensagem: string;
  onTentarDeNovo: () => void;
};

export const EstadoErroHistorico = ({ mensagem, onTentarDeNovo }: Props) => {
  return (
    <div className={styles.erro} role="alert">
      <span className="material-symbols-outlined">wifi_off</span>
      <p className={styles.erroTitulo}>{mensagem}</p>
      <p className={styles.erroTexto}>
        O restante do perfil continua disponível. Tente carregar o histórico de
        novo.
      </p>
      <button type="button" className={styles.botaoTentar} onClick={onTentarDeNovo}>
        Tentar de novo
      </button>
    </div>
  );
};
