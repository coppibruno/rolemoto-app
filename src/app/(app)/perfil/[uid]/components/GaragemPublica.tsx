import { LABEL_TIPO_MOTO_BADGE } from "@/components/perfil/constants-tipo-moto";
import type { PerfilPublico } from "@/types/perfil-publico";
import { ChipTipoMotoPublico } from "./ChipTipoMotoPublico";
import styles from "../perfil-publico.module.css";

type Props = {
  perfil: PerfilPublico;
};

export const GaragemPublica = ({ perfil }: Props) => {
  return (
    <section className={styles.secao} aria-labelledby="garagem-publica-titulo">
      <div className={styles.secaoCabecalho}>
        <div className={styles.secaoTituloLinha}>
          <span className="material-symbols-outlined" aria-hidden>
            garage
          </span>
          <h2 id="garagem-publica-titulo" className={styles.secaoTitulo}>
            Garagem Principal
          </h2>
        </div>
        <span className={styles.chipAtiva}>Ativa no Cockpit</span>
      </div>
      <div className={styles.card}>
        <div className={styles.garagemTopo}>
          <div className={styles.garagemTextos}>
            <span className={styles.motoNome}>{perfil.moto || "—"}</span>
          </div>
          {perfil.tipoMoto ? (
            <span className={styles.badgeTipo}>
              {LABEL_TIPO_MOTO_BADGE[perfil.tipoMoto]}
            </span>
          ) : null}
        </div>
        {perfil.tipoMoto ? (
          <>
            <div className={styles.divisorGaragem} role="presentation" />
            <ChipTipoMotoPublico tipoMoto={perfil.tipoMoto} />
          </>
        ) : null}
      </div>
    </section>
  );
};
