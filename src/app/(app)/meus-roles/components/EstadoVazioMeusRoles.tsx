import type { AbaMeusRoles } from "@/types/meus-roles";
import { VAZIOS } from "../constants";
import styles from "../meus-roles.module.css";

type Props = {
  aba: AbaMeusRoles;
  tuneAtivo: boolean;
};

export const EstadoVazioMeusRoles = ({ aba, tuneAtivo }: Props) => {
  const copy = tuneAtivo ? VAZIOS.tune : VAZIOS[aba];

  return (
    <div className={styles.vazio} role="status">
      <span className={`material-symbols-outlined ${styles.vazioIcone}`}>
        explore_off
      </span>
      <h2 className={styles.vazioTitulo}>{copy.titulo}</h2>
      <p className={styles.vazioTexto}>{copy.corpo}</p>
    </div>
  );
};
