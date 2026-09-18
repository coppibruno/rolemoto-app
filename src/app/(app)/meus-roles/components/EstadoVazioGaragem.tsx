import type { PillAvaliacaoGaragem } from "@/types/meus-roles";
import { VAZIOS_EVENTOS, VAZIOS_LOCAIS } from "../constants";
import styles from "../meus-roles.module.css";

type Props = {
  tipo: "eventos" | "locais";
  pill: PillAvaliacaoGaragem;
};

export const EstadoVazioGaragem = ({ tipo, pill }: Props) => {
  const copy = tipo === "eventos" ? VAZIOS_EVENTOS[pill] : VAZIOS_LOCAIS[pill];
  return (
    <div className={styles.vazio} role="status">
      <span className={`material-symbols-outlined ${styles.vazioIcone}`} aria-hidden>
        {tipo === "eventos" ? "local_activity" : "favorite"}
      </span>
      <h2 className={styles.vazioTitulo}>{copy.titulo}</h2>
      <p className={styles.vazioCorpo}>{copy.corpo}</p>
    </div>
  );
};
