"use client";

import styles from "../sugestoes-locais.module.css";

type Props = {
  idPrefix: string;
  nome: string;
  endereco: string;
  onNome: (valor: string) => void;
  onEndereco: (valor: string) => void;
  erroNome?: string;
  erroEndereco?: string;
  desabilitado?: boolean;
};

export const CamposTextoSugestao = ({
  idPrefix,
  nome,
  endereco,
  onNome,
  onEndereco,
  erroNome,
  erroEndereco,
  desabilitado,
}: Props) => {
  const idNome = `nome-${idPrefix}`;
  const idEndereco = `endereco-${idPrefix}`;
  const erroNomeId = `${idNome}-erro`;
  const erroEnderecoId = `${idEndereco}-erro`;
  const pistaId = `${idEndereco}-pista`;

  return (
    <div className={styles.campos}>
      <div className={styles.campo}>
        <label htmlFor={idNome} className={styles.label}>
          Nome
        </label>
        <input
          id={idNome}
          type="text"
          className={`${styles.input} ${erroNome ? styles.inputErro : ""}`}
          value={nome}
          onChange={(event) => onNome(event.target.value)}
          disabled={desabilitado}
          maxLength={80}
          aria-invalid={Boolean(erroNome)}
          aria-describedby={erroNome ? erroNomeId : undefined}
        />
        {erroNome ? (
          <p id={erroNomeId} className={styles.erroCampo} role="alert">
            {erroNome}
          </p>
        ) : null}
      </div>
      <div className={styles.campo}>
        <label htmlFor={idEndereco} className={styles.label}>
          Endereço
        </label>
        <textarea
          id={idEndereco}
          className={`${styles.input} ${styles.enderecoInput} ${erroEndereco ? styles.inputErro : ""}`}
          value={endereco}
          onChange={(event) => onEndereco(event.target.value)}
          disabled={desabilitado}
          rows={2}
          aria-invalid={Boolean(erroEndereco)}
          aria-describedby={erroEndereco ? `${erroEnderecoId} ${pistaId}` : pistaId}
        />
        <p id={pistaId} className={styles.pista}>
          O pino no mapa é o ponto que o Google encontrou.
        </p>
        {erroEndereco ? (
          <p id={erroEnderecoId} className={styles.erroCampo} role="alert">
            {erroEndereco}
          </p>
        ) : null}
      </div>
    </div>
  );
};
