import styles from "../post-foto.module.css";

type Props = {
  encaminhado: boolean;
  meu: boolean;
  ocupado: boolean;
  erro: string | null;
  curtido: boolean;
  totalCurtidas: number;
  onCurtir: () => void;
  onComentar: () => void;
  onEncaminhar: () => void;
  onApagar: () => void;
};

export const AcoesPost = ({
  encaminhado,
  meu,
  ocupado,
  erro,
  curtido,
  totalCurtidas,
  onCurtir,
  onComentar,
  onEncaminhar,
  onApagar,
}: Props) => (
  <div className={styles.acoes}>
    <div className={styles.linhaIcones}>
      <button
        type="button"
        className={`${styles.iconeAcao} ${curtido ? styles.curtido : ""}`}
        onClick={onCurtir}
        disabled={ocupado}
        aria-pressed={curtido}
        aria-label={curtido ? "Descurtir" : "Curtir"}
      >
        <span className="material-symbols-outlined" aria-hidden>
          favorite
        </span>
      </button>
      <button
        type="button"
        className={styles.iconeAcao}
        onClick={onComentar}
        aria-label="Comentar"
      >
        <span className="material-symbols-outlined" aria-hidden>
          chat_bubble
        </span>
      </button>
      <button
        type="button"
        className={styles.iconeAcao}
        onClick={onEncaminhar}
        disabled={encaminhado || ocupado}
        aria-label={encaminhado ? "Já no seu story" : "Enviar para o story"}
      >
        <span className="material-symbols-outlined" aria-hidden>
          {encaminhado ? "check_circle" : "send"}
        </span>
      </button>
      {meu ? (
        <button
          type="button"
          className={`${styles.iconeAcao} ${styles.iconePerigo}`}
          onClick={onApagar}
          disabled={ocupado}
          aria-label="Apagar publicação"
        >
          <span className="material-symbols-outlined" aria-hidden>
            delete
          </span>
        </button>
      ) : null}
    </div>
    {totalCurtidas > 0 ? (
      <p className={styles.totalCurtidas}>
        {totalCurtidas} {totalCurtidas === 1 ? "curtida" : "curtidas"}
      </p>
    ) : null}
    {erro ? (
      <p className={styles.erro} role="alert">
        {erro}
      </p>
    ) : null}
  </div>
);
