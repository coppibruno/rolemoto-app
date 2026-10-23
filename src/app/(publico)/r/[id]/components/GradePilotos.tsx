import type { ParticipanteDestaque } from "@/types/role-publico";
import { COPY_PRIMEIRO_PILOTO } from "../constants";
import styles from "../convite-role.module.css";

type Props = {
  confirmados: number;
  destaques: ParticipanteDestaque[];
  label?: string;
  countLabel?: (n: number) => string;
  vazio?: string;
};

export const GradePilotos = ({
  confirmados,
  destaques,
  label = "Pilotos na formação",
  countLabel = (n) => `${n} confirmados`,
  vazio = COPY_PRIMEIRO_PILOTO,
}: Props) => {
  const extra = Math.max(0, confirmados - destaques.length);
  const motos = destaques
    .map((d) => d.moto.trim())
    .filter(Boolean)
    .join(", ");

  return (
    <section className={styles.grade}>
      <div className={styles.gradeTopo}>
        <span className={styles.gradeLabel}>{label}</span>
        {confirmados > 0 ? (
          <span className={styles.gradeCount}>{countLabel(confirmados)}</span>
        ) : null}
      </div>
      {confirmados === 0 ? (
        <p className={styles.vazioPilotos}>{vazio}</p>
      ) : (
        <div className={styles.gradeCorpo}>
          <div className={styles.avatares}>
            {destaques.map((piloto, i) =>
              piloto.fotoUrl ? (
                <img
                  key={`${piloto.iniciais}-${i}`}
                  src={piloto.fotoUrl}
                  alt=""
                  title={piloto.moto || piloto.iniciais}
                  aria-label={piloto.moto || piloto.iniciais}
                  className={styles.avatarPiloto}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span
                  key={`${piloto.iniciais}-${i}`}
                  className={styles.avatarPiloto}
                  title={piloto.moto || piloto.iniciais}
                  aria-label={piloto.moto || piloto.iniciais}
                >
                  {piloto.iniciais}
                </span>
              ),
            )}
            {extra > 0 ? (
              <span
                className={styles.avatarMais}
                aria-label={`mais ${extra} pilotos`}
              >
                +{extra}
              </span>
            ) : null}
          </div>
          {motos ? (
            <p className={styles.motos}>
              Motos: <strong>{motos}</strong>
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
};
