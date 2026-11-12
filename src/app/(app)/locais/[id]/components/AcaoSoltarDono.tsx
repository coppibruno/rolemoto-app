import styles from "../ofertas.module.css";

type Props = {
  confirmando: boolean;
  salvando: boolean;
  onPedir: () => void;
  onCancelar: () => void;
  onConfirmar: () => void;
};

export const AcaoSoltarDono = ({
  confirmando,
  salvando,
  onPedir,
  onCancelar,
  onConfirmar,
}: Props) => {
  if (!confirmando) {
    return (
      <button type="button" className={styles.botaoTexto} onClick={onPedir}>
        Soltar
      </button>
    );
  }

  return (
    <div className={styles.confirmarSoltar} role="group" aria-label="Confirmar soltura do dono">
      <span>As ofertas pausam.</span>
      <button
        type="button"
        className={styles.botaoPerigo}
        onClick={onConfirmar}
        disabled={salvando}
      >
        Soltar dono
      </button>
      <button type="button" className={styles.botaoTexto} onClick={onCancelar} disabled={salvando}>
        Cancelar
      </button>
    </div>
  );
};
