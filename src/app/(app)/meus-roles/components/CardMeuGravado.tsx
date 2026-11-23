import Link from "next/link";
import type { RoleTelemetria } from "@/types/role-telemetria";
import { ThumbMapaArquivo } from "@/components/maps/ThumbMapaArquivo";
import { tituloLocal } from "@/lib/localizacao";
import {
  formatarDistancia,
  formatarDuracao,
} from "@/lib/telemetria/formatar-telemetria";
import { formatarDataConcluido } from "../formatar-meus-roles";
import type { AlvoArquivoGaragem } from "../hooks/useArquivoGaragem";
import styles from "../meus-roles.module.css";

type Props = {
  item: RoleTelemetria;
  ocupado: boolean;
  onApagar: (alvo: AlvoArquivoGaragem) => void;
};

export const CardMeuGravado = ({ item, ocupado, onApagar }: Props) => {
  const href = `/telemetria/${item.id}`;
  const foto = item.fotosUrls?.[0] ?? "";
  const saida = tituloLocal(item.pontoInicio);
  const chegada = tituloLocal(item.pontoFim);

  return (
    <article className={styles.card}>
      <div className={styles.cardTopo}>
        <span className={styles.pillConcluido}>
          <span className="material-symbols-outlined">speed</span>
          {item.publica ? "GPS" : "Privado"}
        </span>
        <span className={styles.cardData}>{formatarDataConcluido(item.encerradoEm)}</span>
      </div>

      <div className={styles.cardArquivoTopo}>
        <Link href={href} aria-label={`Abrir ${item.titulo}`} className={styles.cardArquivoThumbLink}>
          <ThumbMapaArquivo
            fotoUrl={foto}
            pontoA={item.pontoInicio}
            pontoB={item.pontoFim}
            iconeFallback="speed"
            ariaLabel={`Mapa de ${item.titulo}`}
          />
        </Link>
        <div className={styles.cardArquivoInfo}>
          <Link href={href} className={styles.cardTituloLink}>
            <h2 className={styles.cardTitulo}>{item.titulo}</h2>
            <p className={styles.cardMeta}>
              {formatarDistancia(item.distanciaKm)} · {formatarDuracao(item.tempoSegundos)}
            </p>
          </Link>
          <p className={styles.cardArquivoRota}>
            <span className={styles.cardArquivoPonto}>
              <span className="material-symbols-outlined" aria-hidden>
                trip_origin
              </span>
              {saida}
            </span>
            <span className={styles.cardArquivoSeta} aria-hidden>
              →
            </span>
            <span className={styles.cardArquivoPonto}>
              <span className="material-symbols-outlined" aria-hidden>
                flag
              </span>
              {chegada}
            </span>
          </p>
        </div>
      </div>

      <div className={styles.cardAcoes}>
        <Link href={href} className={styles.botaoSecundario}>
          Abrir
        </Link>
        <button
          type="button"
          className={styles.botaoCancelar}
          aria-label={`Apagar passeio ${item.titulo}`}
          disabled={ocupado}
          onClick={() =>
            onApagar({ tipo: "telemetria", id: item.id, titulo: item.titulo })
          }
        >
          <span className="material-symbols-outlined" aria-hidden>
            delete
          </span>
          Apagar
        </button>
      </div>
    </article>
  );
};
