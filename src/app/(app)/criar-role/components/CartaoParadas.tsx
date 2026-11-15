"use client";

import { MAX_PARADAS } from "@/lib/mapa-viagem/viagem";
import type { useParadasRole } from "../hooks/useParadasRole";
import { EditorParada } from "./EditorParada";
import { LinhaParada } from "./LinhaParada";
import styles from "../criar-role.module.css";

type Props = {
  paradas: ReturnType<typeof useParadasRole>;
  desabilitado?: boolean;
};

export const CartaoParadas = ({ paradas, desabilitado }: Props) => {
  const total = paradas.paradas.length;

  return (
    <div className={styles.cartao}>
      <div className={styles.labelLinha}>
        <span className={styles.label}>
          <span className="material-symbols-outlined" aria-hidden>
            more_vert
          </span>
          Paradas
        </span>
        <span className={styles.hintOpcional}>opcional</span>
      </div>

      {total > 0 ? (
        <ol className={styles.listaParadas} aria-label="Paradas na ordem da viagem">
          {paradas.paradas.map((ponto, indice) => (
            <LinhaParada
              key={`${indice}-${ponto.lat}-${ponto.lng}`}
              ponto={ponto}
              indice={indice}
              ultima={indice === total - 1}
              desabilitado={desabilitado}
              onSubir={() => paradas.subir(indice)}
              onDescer={() => paradas.descer(indice)}
              onRemover={() => paradas.remover(indice)}
            />
          ))}
        </ol>
      ) : null}

      {paradas.editando ? (
        <EditorParada
          numero={total + 1}
          onIncluir={paradas.incluir}
          onCancelar={paradas.fecharEditor}
        />
      ) : paradas.cheio ? (
        <p className={styles.hintParadas}>Até {MAX_PARADAS} paradas</p>
      ) : (
        <button
          type="button"
          className={styles.botaoMapa}
          onClick={paradas.abrirEditor}
          disabled={desabilitado}
        >
          <span className="material-symbols-outlined" aria-hidden>
            add_location_alt
          </span>
          Adicionar parada
        </button>
      )}
    </div>
  );
};
