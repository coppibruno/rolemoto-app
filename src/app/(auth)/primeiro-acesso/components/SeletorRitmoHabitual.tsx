"use client";

import type { Pilotagem } from "@/types/user";
import { COPY, OPCOES_RITMO_HABITUAL } from "../constants";
import { CardRitmo } from "./CardRitmo";
import styles from "../primeiro-acesso.module.css";

type Props = {
  valor: Pilotagem | null;
  onChange: (valor: Pilotagem) => void;
  erro?: string;
  desabilitado?: boolean;
};

export const SeletorRitmoHabitual = ({
  valor,
  onChange,
  erro,
  desabilitado,
}: Props) => {
  const erroId = "ritmo-erro";

  return (
    <div className={styles.ritmoBloco}>
      <div>
        <span className={styles.label} id="ritmo-label">
          {COPY.ritmoTitulo}
        </span>
        <p className={styles.ritmoSubtitulo}>{COPY.ritmoSubtitulo}</p>
      </div>
      <div
        className={styles.ritmoLista}
        role="radiogroup"
        aria-labelledby="ritmo-label"
        aria-describedby={erro ? erroId : undefined}
      >
        {OPCOES_RITMO_HABITUAL.map((opcao) => (
          <CardRitmo
            key={opcao.valor}
            opcao={opcao}
            selecionado={valor === opcao.valor}
            onSelect={() => onChange(opcao.valor)}
            desabilitado={desabilitado}
          />
        ))}
      </div>
      {erro ? (
        <p id={erroId} className={styles.erroCampo} role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
};
