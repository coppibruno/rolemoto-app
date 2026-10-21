import type { PillAvaliacaoGaragem, RecorteLocaisGaragem } from "@/types/meus-roles";
import {
  VAZIO_LOCAIS_VISITADOS,
  VAZIOS_EVENTOS,
  VAZIOS_LOCAIS,
} from "../constants";
import styles from "../meus-roles.module.css";

type Props = {
  tipo: "eventos" | "locais";
  pill: PillAvaliacaoGaragem;
  recorteLocais?: RecorteLocaisGaragem;
};

export const EstadoVazioGaragem = ({ tipo, pill, recorteLocais }: Props) => {
  const copy =
    tipo === "eventos"
      ? VAZIOS_EVENTOS[pill]
      : recorteLocais === "visitados"
        ? VAZIO_LOCAIS_VISITADOS[pill]
        : VAZIOS_LOCAIS[pill];
  const icone =
    tipo === "eventos"
      ? "local_activity"
      : recorteLocais === "visitados"
        ? "where_to_vote"
        : "favorite";
  return (
    <div className={styles.vazio} role="status">
      <span className={`material-symbols-outlined ${styles.vazioIcone}`} aria-hidden>
        {icone}
      </span>
      <h2 className={styles.vazioTitulo}>{copy.titulo}</h2>
      <p className={styles.vazioCorpo}>{copy.corpo}</p>
    </div>
  );
};
