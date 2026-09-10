"use client";

import { useExcluirConta } from "../hooks/useExcluirConta";
import { ModalExcluirConta } from "./ModalExcluirConta";
import styles from "../perfil.module.css";

type Props = {
  desabilitado?: boolean;
};

export const BotaoExcluirConta = ({ desabilitado }: Props) => {
  const { aberto, excluindo, erro, abrir, fechar, confirmar } = useExcluirConta();

  return (
    <>
      <button
        type="button"
        className={styles.botaoExcluir}
        onClick={abrir}
        disabled={desabilitado || excluindo}
      >
        <span className="material-symbols-outlined">delete_forever</span>
        Excluir Conta
      </button>
      {aberto ? (
        <ModalExcluirConta
          excluindo={excluindo}
          erro={erro}
          onFechar={fechar}
          onConfirmar={confirmar}
        />
      ) : null}
    </>
  );
};
