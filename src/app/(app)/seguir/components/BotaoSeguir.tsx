"use client";

import { useSeguirPiloto } from "../hooks/useSeguirPiloto";
import { ModalDeixarDeSeguir } from "./ModalDeixarDeSeguir";
import styles from "../seguir.module.css";

type Props = {
  uid: string;
  apelido: string;
  seguido: boolean;
  largo?: boolean;
};

export const BotaoSeguir = ({ uid, apelido, seguido, largo = false }: Props) => {
  const acao = useSeguirPiloto(uid, seguido);
  const classe = [
    styles.botaoSeguir,
    acao.seguido ? styles.botaoSeguindo : "",
    largo ? styles.botaoLargo : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <button
        type="button"
        className={classe}
        aria-pressed={acao.seguido}
        disabled={acao.enviando}
        onClick={(evento) => {
          evento.preventDefault();
          evento.stopPropagation();
          acao.aoClicar();
        }}
      >
        {acao.seguido ? "Seguindo" : "Seguir"}
      </button>
      {acao.confirmando ? (
        <ModalDeixarDeSeguir
          apelido={apelido}
          onCancelar={acao.cancelar}
          onConfirmar={() => void acao.confirmarDeixar()}
        />
      ) : null}
      {acao.toast ? (
        <p className={styles.toast} role="status">
          {acao.toast}
        </p>
      ) : null}
    </>
  );
};
