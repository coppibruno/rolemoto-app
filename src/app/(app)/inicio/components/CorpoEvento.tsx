import type { AlvoEvento } from "@/types/atividade";
import { dataHoraCurta } from "../atividade-texto";
import styles from "../inicio.module.css";

type Props = {
  alvo: AlvoEvento;
};

export const CorpoEvento = ({ alvo }: Props) => (
  <>
    <div className={styles.capaRole}>
      {alvo.fotoCapaUrl ? <img src={alvo.fotoCapaUrl} alt="" /> : null}
    </div>
    <div className={styles.blocoConteudo}>
      <h3 className={styles.tituloRole}>{alvo.titulo}</h3>
      <p className={styles.metaRole}>
        {dataHoraCurta(alvo.dataHoraAbertura)} · {alvo.localNome}
      </p>
    </div>
  </>
);
