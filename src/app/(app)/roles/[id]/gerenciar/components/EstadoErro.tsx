import styles from "../gerenciar-role.module.css";

type Props = {
  mensagem: string;
  onVoltar: () => void;
  onTentar?: () => void;
};

export const EstadoErro = ({ mensagem, onVoltar, onTentar }: Props) => (
  <div className={styles.estado} role="alert">
    <span className="material-symbols-outlined">error</span>
    <p className={styles.estadoTitulo}>{mensagem}</p>
    <p className={styles.estadoTexto}>
      Não foi possível abrir o gerenciamento deste rolê.
    </p>
    {onTentar ? (
      <button type="button" className={styles.botaoEstado} onClick={onTentar}>
        Tentar de novo
      </button>
    ) : null}
    <button type="button" className={styles.botaoEstado} onClick={onVoltar}>
      Voltar aos meus rolês
    </button>
  </div>
);
