import type { CriadorPublico } from "@/types/role-publico";
import { iniciaisDe } from "../constants";
import styles from "../convite-role.module.css";

type Props = {
  criador: CriadorPublico;
};

export const CardOrganizador = ({ criador }: Props) => {
  const nome = criador.nome.trim() || criador.apelido || "Piloto";
  const apelido = criador.apelido || "piloto";
  const iniciais = iniciaisDe(criador.nome, criador.apelido);

  return (
    <section className={styles.cardOrganizador}>
      <div className={styles.organizadorInfo}>
        {criador.fotoUrl ? (
          <img
            src={criador.fotoUrl}
            alt=""
            className={styles.avatarLider}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className={styles.avatarLiderIniciais} aria-hidden>
            {iniciais}
          </span>
        )}
        <div>
          <p className={styles.organizadorNome}>
            {nome}{" "}
            <span className={styles.organizadorApelido}>(@{apelido})</span>
          </p>
          {criador.moto ? (
            <p className={styles.organizadorMoto}>{criador.moto}</p>
          ) : null}
        </div>
      </div>
      <span className={styles.pillOrganizador}>Organizador</span>
    </section>
  );
};
