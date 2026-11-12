import { DIAS_CURTOS } from "@/lib/rotulo-dia-semana";
import styles from "../../ofertas.module.css";

type Props = {
  dias: number[];
  onChange: (dias: number[]) => void;
};

export const SeletorDiasOferta = ({ dias, onChange }: Props) => {
  const alternar = (dia: number) =>
    onChange(
      dias.includes(dia) ? dias.filter((d) => d !== dia) : [...dias, dia].sort((a, b) => a - b),
    );

  return (
    <div className={styles.dias}>
      {DIAS_CURTOS.map((rotulo, dia) => (
        <button
          key={rotulo}
          type="button"
          aria-pressed={dias.includes(dia)}
          className={`${styles.chip} ${dias.includes(dia) ? styles.chipAtivo : ""}`}
          onClick={() => alternar(dia)}
        >
          {rotulo}
        </button>
      ))}
    </div>
  );
};
