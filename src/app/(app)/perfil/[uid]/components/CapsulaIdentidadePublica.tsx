import type { PerfilPublico } from "@/types/perfil-publico";
import styles from "../perfil-publico.module.css";

type Props = {
  perfil: PerfilPublico;
};

export const CapsulaIdentidadePublica = ({ perfil }: Props) => {
  return (
    <section className={styles.capsula} aria-label="Identidade do piloto">
      <div className={styles.avatarWrap}>
        {perfil.fotoUrl ? (
          <img
            src={perfil.fotoUrl}
            alt={`Foto de ${perfil.nome}`}
            className={styles.avatar}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className={styles.avatarPlaceholder} aria-hidden>
            <span className="material-symbols-outlined">account_circle</span>
          </span>
        )}
      </div>
      <div className={styles.capsulaTextos}>
        <span className={styles.nome}>{perfil.nome}</span>
        <span className={styles.apelido}>@{perfil.apelido}</span>
      </div>
    </section>
  );
};
