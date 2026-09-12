import { ERRO_MEUS_ROLES } from "../constants";
import styles from "../meus-roles.module.css";

type Props = {
  onTentar: () => void;
};

export const EstadoErroMeusRoles = ({ onTentar }: Props) => {
  return (
    <div className={styles.erro} role="alert">
      <span className="material-symbols-outlined">wifi_off</span>
      <p className={styles.erroTitulo}>{ERRO_MEUS_ROLES}</p>
      <button type="button" className={styles.botaoTentar} onClick={onTentar}>
        Tentar de novo
      </button>
    </div>
  );
};
