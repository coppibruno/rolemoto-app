"use client";

import type { AcessoEvento } from "@/types/evento";
import { OPCOES_ACESSO } from "../constants";
import styles from "../criar-evento.module.css";

type Props = {
  valor: AcessoEvento;
  onChange: (valor: AcessoEvento) => void;
  erro?: string;
  desabilitado?: boolean;
};

const iconeInativo: Record<AcessoEvento, string> = {
  gratis: "",
  ingresso: styles.iconeIngresso,
};

export const SeletorAcesso = ({ valor, onChange, erro, desabilitado }: Props) => {
  const erroId = "acesso-evento-erro";

  return (
    <div className={styles.campo}>
      <span className={styles.label} id="acesso-evento-label">
        Modalidade de Acesso / Entrada{" "}
        <span className={styles.obrigatorio}>*</span>
      </span>
      <div
        className={styles.gradeAcesso}
        role="radiogroup"
        aria-labelledby="acesso-evento-label"
        aria-describedby={erro ? erroId : undefined}
      >
        {OPCOES_ACESSO.map((opcao) => {
          const ativo = opcao.valor === valor;
          return (
            <button
              key={opcao.valor}
              type="button"
              role="radio"
              aria-checked={ativo}
              className={`${styles.cardAcesso} ${ativo ? styles.cardAcessoAtivo : ""}`}
              onClick={() => onChange(opcao.valor)}
              disabled={desabilitado}
            >
              <span
                className={`material-symbols-outlined ${
                  ativo ? "" : iconeInativo[opcao.valor]
                }`}
                aria-hidden
              >
                {opcao.icone}
              </span>
              <span className={styles.cardAcessoLabel}>{opcao.label}</span>
              <span className={styles.cardAcessoSub}>{opcao.subtitulo}</span>
            </button>
          );
        })}
      </div>
      {erro ? (
        <p id={erroId} className={styles.erroCampo} role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
};
