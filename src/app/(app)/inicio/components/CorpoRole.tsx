import type { AlvoRole } from "@/types/atividade";
import { dataHoraCurta } from "../atividade-texto";
import styles from "../inicio.module.css";

type Props = {
  alvo: AlvoRole;
  realizado?: boolean;
};

const classeBolinha = (ritmo: AlvoRole["ritmo"]) => {
  if (ritmo === "tranquila") return styles.bolinhaTranquila;
  if (ritmo === "moderada") return styles.bolinhaModerada;
  return styles.bolinhaAgressiva;
};

export const CorpoRole = ({ alvo, realizado = false }: Props) => (
  <>
    <div className={styles.capaRole}>
      {alvo.fotoCapaUrl ? <img src={alvo.fotoCapaUrl} alt="" /> : null}
      <span className={styles.seloRitmo}>
        <span className={`${styles.bolinha} ${classeBolinha(alvo.ritmo)}`} aria-hidden />
        {alvo.ritmo}
      </span>
      {realizado ? <span className={styles.seloRealizado}>Realizado</span> : null}
    </div>
    <div className={styles.blocoConteudo}>
      <h3 className={styles.tituloRole}>{alvo.titulo}</h3>
      <div className={styles.metasRole}>
        <p className={styles.metaRole}>
          {dataHoraCurta(alvo.dataHoraSaida)} · {alvo.saidaNome}
        </p>
        <p className={styles.metaRole}>→ {alvo.destinoNome}</p>
      </div>
    </div>
    {realizado && alvo.participantes && alvo.participantes.length > 0 ? (
      <div className={styles.pilha}>
        <div className={styles.pilhaAvatares} aria-hidden>
          {alvo.participantes.slice(0, 5).map((p) =>
            p.fotoUrl ? (
              <img
                key={p.uid}
                src={p.fotoUrl}
                alt=""
                className={styles.avatar32}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span key={p.uid} className={styles.avatar32} />
            ),
          )}
        </div>
        <span className={styles.pilhaTexto}>
          {alvo.confirmados} {alvo.confirmados === 1 ? "piloto" : "pilotos"}
        </span>
      </div>
    ) : null}
  </>
);
