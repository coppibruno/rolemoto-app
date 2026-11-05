"use client";

import type { LinhaPiloto } from "@/types/seguir";
import styles from "../convidar.module.css";

type Estado = "livre" | "marcada" | "inscrito" | "convidado";

type Props = {
  pessoa: LinhaPiloto;
  estado: Estado;
  onAlternar: (uid: string) => void;
};

const marcaApelido = (pessoa: LinhaPiloto): string => {
  const apelido = pessoa.apelido.trim();
  const primeiro = pessoa.nome.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (!apelido || apelido === "piloto" || apelido.toLowerCase() === primeiro) {
    return "";
  }
  return apelido;
};

export const LinhaConvite = ({ pessoa, estado, onAlternar }: Props) => {
  const apelido = marcaApelido(pessoa);
  const cidade = pessoa.cidade.trim();
  const bloqueada = estado === "inscrito" || estado === "convidado";

  return (
    <button
      type="button"
      className={styles.linha}
      aria-pressed={estado === "marcada"}
      aria-disabled={bloqueada}
      onClick={() => {
        if (!bloqueada) onAlternar(pessoa.uid);
      }}
    >
      {pessoa.fotoUrl ? (
        <img src={pessoa.fotoUrl} alt="" className={styles.foto} referrerPolicy="no-referrer" />
      ) : (
        <span className={styles.fotoVazia} aria-hidden>
          <span className="material-symbols-outlined">person</span>
        </span>
      )}
      <span className={styles.textos}>
        <span className={styles.nomeLinha}>{pessoa.nome}</span>
        {apelido ? <span className={styles.marca}>@{apelido}</span> : null}
        {cidade ? <span className={styles.cidade}>{cidade}</span> : null}
        {pessoa.segueVoce ? <span className={styles.segueVoce}>Segue você</span> : null}
      </span>
      {estado === "inscrito" ? <span className={styles.status}>Já vai</span> : null}
      {estado === "convidado" ? <span className={styles.status}>Convidado</span> : null}
      {estado === "livre" || estado === "marcada" ? (
        <span
          className={estado === "marcada" ? styles.caixaMarcada : styles.caixa}
          aria-hidden
        >
          {estado === "marcada" ? (
            <span className="material-symbols-outlined">check</span>
          ) : null}
        </span>
      ) : null}
    </button>
  );
};
