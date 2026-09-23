"use client";

import styles from "./opcoes-salvar-senha.module.css";

type Props = {
  salvarSenha: boolean;
  entrarAutomatico: boolean;
  desabilitado?: boolean;
  onSalvarSenha: (valor: boolean) => void;
  onEntrarAutomatico: (valor: boolean) => void;
};

export const OpcoesSalvarSenha = ({
  salvarSenha,
  entrarAutomatico,
  desabilitado,
  onSalvarSenha,
  onEntrarAutomatico,
}: Props) => (
  <fieldset className={styles.grupo} disabled={desabilitado}>
    <legend className={styles.legenda}>Neste aparelho</legend>
    <label className={styles.opcao}>
      <input
        type="checkbox"
        checked={salvarSenha}
        onChange={(e) => onSalvarSenha(e.target.checked)}
      />
      <span>Salvar senha para não digitar de novo</span>
    </label>
    {salvarSenha ? (
      <label className={styles.opcao}>
        <input
          type="checkbox"
          checked={entrarAutomatico}
          onChange={(e) => onEntrarAutomatico(e.target.checked)}
        />
        <span>Entrar automaticamente na próxima vez</span>
      </label>
    ) : null}
  </fieldset>
);
