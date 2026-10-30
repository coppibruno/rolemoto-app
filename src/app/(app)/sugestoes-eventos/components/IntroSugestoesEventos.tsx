"use client";

import styles from "../sugestoes-eventos.module.css";

type Props = {
  buscando: boolean;
  resumo: string | null;
  erro: string | null;
  onBuscar: () => void;
};

export const IntroSugestoesEventos = ({ buscando, resumo, erro, onBuscar }: Props) => {
  return (
    <div className={styles.intro}>
      <span className={styles.badgeAdmin}>
        <span className={styles.pontoPulse} aria-hidden />
        Painel Admin
      </span>
      <h2 className={styles.introTitulo}>Sugestões de eventos</h2>
      <p className={styles.introSubtitulo}>
        Encontros, festivais e aniversários de motoclube em SC, PR e RS. Homologar publica no
        feed.
      </p>
      <button type="button" className={styles.buscar} onClick={onBuscar} disabled={buscando}>
        {buscando ? "Buscando…" : "Buscar agora"}
      </button>
      <p className={styles.dica}>A rodada lê a agenda do MotoClub Brasil. O pin vem do endereço.</p>
      {resumo ? (
        <p className={styles.resumo} role="status">
          {resumo}
        </p>
      ) : null}
      {erro ? (
        <p className={styles.erro} role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
};
