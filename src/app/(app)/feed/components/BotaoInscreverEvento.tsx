"use client";

import Link from "next/link";
import type { AcessoEvento } from "@/types/evento";
import { useInscricaoEvento } from "../hooks/useInscricaoEvento";
import { ModalIngressoEvento } from "./ModalIngressoEvento";
import styles from "../feed.module.css";

type Props = {
  id: string;
  acesso: AcessoEvento;
  linkIngresso: string | null;
  inscrito: boolean;
  podeConvidar: boolean;
};

const LinkConvidarEvento = ({ id, cheio }: { id: string; cheio?: boolean }) => (
  <Link
    href={`/eventos/${id}/convidar`}
    className={
      cheio
        ? `${styles.botaoConvidarEvento} ${styles.botaoConvidarCheio}`
        : styles.botaoConvidarEvento
    }
    aria-label="Convidar amigo para o evento"
  >
    Convidar amigo
  </Link>
);

export const BotaoInscreverEvento = ({
  id,
  acesso,
  linkIngresso,
  inscrito: inscritoInicial,
  podeConvidar,
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
  const rotulo = enviando
    ? "Inscrevendo…"
    : acesso === "ingresso"
      ? "Comprar ingresso"
      : "Inscreva-se";

  const botaoInscrever = (
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
      {rotulo}
    </button>
  );

  return (
    <div className={styles.blocoInscricaoEvento}>
      {!inscrito ? (
        podeConvidar ? (
          <div className={styles.linhaAcoesEvento}>
            {botaoInscrever}
            <LinkConvidarEvento id={id} />
          </div>
        ) : (
          botaoInscrever
        )
      ) : (
        <>
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
          {podeConvidar ? <LinkConvidarEvento id={id} cheio /> : null}
        </>
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
