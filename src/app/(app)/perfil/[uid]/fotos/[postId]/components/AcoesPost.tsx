import styles from "../post-foto.module.css";

type Props = {
  encaminhado: boolean;
  meu: boolean;
  ocupado: boolean;
  erro: string | null;
  curtido: boolean;
  totalCurtidas: number;
  onCurtir: () => void;
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
  onEncaminhar,
  onApagar,
}: Props) => (
  <div className={styles.acoes}>
    <button
      type="button"
      className={`${styles.secundario} ${curtido ? styles.curtido : ""}`}
      onClick={onCurtir}
      disabled={ocupado}
      aria-pressed={curtido}
      aria-label={curtido ? "Descurtir" : "Curtir"}
    >
      <span className="material-symbols-outlined" aria-hidden>
        favorite
      </span>
      {totalCurtidas > 0 ? totalCurtidas : "Curtir"}
    </button>
    <button
      type="button"
      className={styles.secundario}
      onClick={onEncaminhar}
      disabled={encaminhado || ocupado}
    >
      <span className="material-symbols-outlined" aria-hidden>
        {encaminhado ? "check_circle" : "add_circle"}
      </span>
      {encaminhado ? "No seu story" : "Adicionar ao story"}
    </button>
    {meu ? (
      <button type="button" className={styles.perigo} onClick={onApagar} disabled={ocupado}>
        <span className="material-symbols-outlined" aria-hidden>
          delete
        </span>
        Apagar publicação
      </button>
    ) : null}
    {erro ? (
      <p className={styles.erro} role="alert">
        {erro}
      </p>
    ) : null}
  </div>
);
