import type { Usuario } from "@/types/user";
import { TelemetriaGaragem } from "./TelemetriaGaragem";
import type { TelemetriaMeusRoles } from "@/types/meus-roles";
import styles from "../meus-roles.module.css";

type Props = {
  usuario: Usuario | null;
  telemetria: TelemetriaMeusRoles;
};

const iniciais = (usuario: Usuario): string => {
  const fonte = usuario.nome.trim() || usuario.apelido.trim() || "P";
  const tokens = fonte.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
  }
  return fonte.slice(0, 2).toUpperCase();
};

export const CardPilotoGaragem = ({ usuario, telemetria }: Props) => {
  const nome = usuario?.apelido || usuario?.nome || "Piloto";
  const moto = usuario?.moto?.trim() || "";
  const cidade = usuario?.cidade?.trim() || "";
  const meta = [moto, cidade].filter(Boolean).join(" · ");

  return (
    <section className={styles.cardPiloto} aria-label="Resumo do piloto">
      <div className={styles.cardPilotoTopo}>
        <div className={styles.cardPilotoIdentidade}>
          <div className={styles.avatarPiloto}>
            {usuario?.fotoUrl ? (
              <img src={usuario.fotoUrl} alt="" className={styles.avatarPilotoImg} />
            ) : (
              <span className={styles.avatarPilotoFallback} aria-hidden>
                {usuario ? iniciais(usuario) : "P"}
              </span>
            )}
          </div>
          <div className={styles.cardPilotoTextos}>
            <h2 className={styles.cardPilotoNome}>{nome}</h2>
            {meta ? <p className={styles.cardPilotoMeta}>{meta}</p> : null}
          </div>
        </div>
      </div>
      <TelemetriaGaragem telemetria={telemetria} />
    </section>
  );
};
