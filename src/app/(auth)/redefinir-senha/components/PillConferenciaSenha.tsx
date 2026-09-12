import { COPY_PILL, MIN_SENHA, type EstadoConferencia } from "../constants";
import styles from "../redefinir-senha.module.css";

type Props = {
  senha: string;
  confirmacao: string;
};

const resolver = (senha: string, confirmacao: string): EstadoConferencia => {
  if (!confirmacao) return "aguardando";
  if (senha !== confirmacao) return "diferentes";
  return senha.length >= MIN_SENHA ? "coincidem" : "curtas";
};

const ICONES: Record<EstadoConferencia, string> = {
  aguardando: "radio_button_unchecked",
  coincidem: "check_circle",
  curtas: "check_circle",
  diferentes: "cancel",
};

export const PillConferenciaSenha = ({ senha, confirmacao }: Props) => {
  const estado = resolver(senha, confirmacao);

  return (
    <div
      className={`${styles.pillMatch} ${styles[`pill_${estado}`]}`}
      aria-live="polite"
    >
      <span className={`material-symbols-outlined ${styles.pillIcone}`}>
        {ICONES[estado]}
      </span>
      <span>{COPY_PILL[estado]}</span>
    </div>
  );
};
