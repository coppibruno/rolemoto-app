"use client";

import type { AcessoEvento } from "@/types/evento";
import { useInscricaoEvento } from "../hooks/useInscricaoEvento";
import { ModalIngressoEvento } from "./ModalIngressoEvento";
import styles from "../feed.module.css";

type Props = {
  id: string;
  acesso: AcessoEvento;
  linkIngresso: string | null;
  inscrito: boolean;
};

export const BotaoInscreverEvento = ({
  id,
  acesso,
  linkIngresso,
  inscrito: inscritoInicial,
}: Props) => {
  const {
    inscrito,
    enviando,
    modalAberto,
    etapaModal,
    erro,
    toast,
    inscrever,
    cancelar,
    fecharModal,
    abrirModalIngresso,
    abrirLinkIngresso,
    confirmarInscricao,
  } = useInscricaoEvento({
    id,
    acesso,
    linkIngresso,
    inscrito: inscritoInicial,
  });

  const icone = acesso === "ingresso" ? "confirmation_number" : "event_available";

  return (
    <div className={styles.blocoInscricaoEvento}>
      {!inscrito ? (
        <button
          type="button"
          className={styles.botaoInscreverEvento}
          onClick={() => void inscrever()}
          disabled={enviando}
          aria-busy={enviando}
        >
          <span className="material-symbols-outlined" aria-hidden>
            {enviando ? "autorenew" : icone}
          </span>
          {enviando
            ? "Inscrevendo…"
            : acesso === "ingresso"
              ? "Comprar ingresso"
              : "Inscrever-se"}
        </button>
      ) : (
        <div className={styles.acoesInscritoEvento}>
          <span className={styles.chipInscrito} aria-live="polite">
            <span className="material-symbols-outlined" aria-hidden>
              check_circle
            </span>
            {acesso === "ingresso" ? "Inscrito · ingresso por sua conta" : "Inscrito"}
          </span>
          {acesso === "ingresso" ? (
            <button
              type="button"
              className={styles.botaoSecundarioEvento}
              onClick={abrirModalIngresso}
              disabled={enviando}
            >
              Comprar ingresso
            </button>
          ) : null}
          <button
            type="button"
            className={styles.botaoSecundarioEvento}
            onClick={() => void cancelar()}
            disabled={enviando}
            aria-busy={enviando}
          >
            {enviando ? "Cancelando…" : "Cancelar"}
          </button>
        </div>
      )}

      {erro ? (
        <p className={styles.erroInscricaoEvento} role="alert">
          {erro}
        </p>
      ) : null}

      {toast ? (
        <span className={styles.toastInscricaoEvento} role="status">
          {toast}
        </span>
      ) : null}

      {modalAberto ? (
        <ModalIngressoEvento
          etapa={etapaModal}
          enviando={enviando}
          linkIngresso={linkIngresso}
          onComprar={abrirLinkIngresso}
          onConfirmar={() => void confirmarInscricao()}
          onFechar={fecharModal}
        />
      ) : null}
    </div>
  );
};
