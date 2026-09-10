"use client";

import { useFocoModal } from "@/hooks/useFocoModal";
import styles from "../perfil.module.css";

type Props = {
  excluindo: boolean;
  erro: string | null;
  onFechar: () => void;
  onConfirmar: () => void;
};

export const ModalExcluirConta = ({
  excluindo,
  erro,
  onFechar,
  onConfirmar,
}: Props) => {
  const cartaoRef = useFocoModal(onFechar);

  return (
    <div className={styles.overlayExcluir} onClick={onFechar}>
      <div
        ref={cartaoRef}
        className={styles.cartaoExcluir}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-excluir-conta"
        aria-describedby="descricao-excluir-conta"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.cabecalhoExcluir}>
          <div className={styles.iconeAlertaExcluir} aria-hidden>
            <span className="material-symbols-outlined">warning</span>
          </div>
          <div>
            <h2 id="titulo-excluir-conta" className={styles.tituloExcluir}>
              Excluir Conta?
            </h2>
            <span className={styles.badgeExcluir}>Ação Irreversível</span>
          </div>
        </div>

        <p id="descricao-excluir-conta" className={styles.corpoExcluir}>
          Esta ação é permanente e irreversível. Todos os seus dados de piloto,
          histórico de rolês, motos cadastradas e reputação na comunidade serão
          apagados definitivamente.
        </p>

        <div className={styles.faixaShield}>
          <span className="material-symbols-outlined" aria-hidden>
            shield
          </span>
          <p>Tem certeza de que deseja acelerar para fora da comunidade?</p>
        </div>

        {erro ? (
          <p className={styles.erroExcluir} role="alert">
            {erro}
          </p>
        ) : null}

        <div className={styles.acoesExcluir}>
          <button
            type="button"
            className={styles.botaoConfirmarExcluir}
            onClick={onConfirmar}
            disabled={excluindo}
          >
            <span className="material-symbols-outlined">delete_forever</span>
            {excluindo ? "Excluindo…" : "Sim, Excluir Minha Conta"}
          </button>
          <button
            type="button"
            className={styles.botaoCancelarExcluir}
            onClick={onFechar}
            disabled={excluindo}
            data-foco-inicial
          >
            Cancelar e Manter Conta
          </button>
        </div>
      </div>
    </div>
  );
};
