"use client";

import type { DonoLocal } from "@/types/oferta-local";
import {
  DONO_BUSCA_PLACEHOLDER,
  DONO_NINGUEM,
  TITULO_DONO_BALCAO,
} from "../constants";
import { useDonoBalcao } from "../hooks/useDonoBalcao";
import { AcaoSoltarDono } from "./AcaoSoltarDono";
import styles from "../ofertas.module.css";

type Props = {
  localId: string;
  donoInicial: DonoLocal | null;
};

export const BlocoDonoBalcao = ({ localId, donoInicial }: Props) => {
  const d = useDonoBalcao({ localId, donoInicial });

  return (
    <section className={styles.bloco} aria-labelledby="titulo-dono-balcao">
      <h2 id="titulo-dono-balcao" className={styles.secao}>
        {TITULO_DONO_BALCAO}
      </h2>
      <div className={styles.donoAtual}>
        <span className={styles.donoNome}>{d.dono?.nome ?? DONO_NINGUEM}</span>
        {d.dono ? (
          <AcaoSoltarDono
            confirmando={d.confirmandoSoltar}
            salvando={d.salvando}
            onPedir={d.pedirSoltar}
            onCancelar={d.cancelarSoltar}
            onConfirmar={d.soltar}
          />
        ) : null}
      </div>
      <input
        type="search"
        className={styles.input}
        placeholder={DONO_BUSCA_PLACEHOLDER}
        value={d.termo}
        onChange={(e) => d.setTermo(e.target.value)}
        aria-label={DONO_BUSCA_PLACEHOLDER}
        disabled={d.salvando}
      />
      {d.resultados.length > 0 ? (
        <ul className={styles.resultadosBusca}>
          {d.resultados.map((piloto) => (
            <li key={piloto.uid}>
              <button
                type="button"
                className={styles.resultadoBusca}
                onClick={() => d.escolher(piloto)}
                disabled={d.salvando}
              >
                <strong>{piloto.apelido || piloto.nome}</strong>
                {piloto.cidade ? <small>{piloto.cidade}</small> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {d.erro ? (
        <p className={styles.erro} role="alert">
          {d.erro}
        </p>
      ) : null}
    </section>
  );
};
