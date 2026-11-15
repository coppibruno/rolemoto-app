"use client";

import Link from "next/link";
import { useModeloRole } from "@/app/(app)/criar-role/hooks/useModeloRole";
import { LABELS_ACESSO_FICHA, LABELS_RITMO_FICHA } from "@/app/(publico)/r/[id]/constants";
import { useFocoModal } from "@/hooks/useFocoModal";
import { tituloLocal } from "@/lib/localizacao";
import { BlocoParadasRole } from "./BlocoParadasRole";
import styles from "./faixa-rotas.module.css";

type Props = {
  roleId: string;
  onFechar: () => void;
};

export const hrefReutilizarRota = (roleId: string) =>
  `/criar-role?origem=${encodeURIComponent(roleId)}`;

export const FichaRota = ({ roleId, onFechar }: Props) => {
  const folhaRef = useFocoModal(onFechar);
  const { modelo, carregando, erro } = useModeloRole(roleId);

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div
        ref={folhaRef}
        className={styles.folha}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-ficha-rota"
        onClick={(evento) => evento.stopPropagation()}
      >
        {carregando ? <p className={styles.dica}>Carregando…</p> : null}
        {erro ? <p className={styles.dica}>{erro.mensagem}</p> : null}
        {modelo ? (
          <>
            <h2 id="titulo-ficha-rota" className={styles.fichaTitulo}>
              {modelo.titulo}
            </h2>
            <dl className={styles.ficha}>
              <div className={styles.fichaLinha}>
                <dt>Saída</dt>
                <dd>{tituloLocal(modelo.localSaida)}</dd>
              </div>
              {modelo.paradas.length > 0 ? (
                <div className={styles.fichaLinha}>
                  <dt>Paradas</dt>
                  <dd>
                    <BlocoParadasRole paradas={modelo.paradas} comRotulo={false} />
                  </dd>
                </div>
              ) : null}
              <div className={styles.fichaLinha}>
                <dt>Destino</dt>
                <dd>{tituloLocal(modelo.destinoFinal)}</dd>
              </div>
              <div className={styles.fichaLinha}>
                <dt>Ritmo</dt>
                <dd>{LABELS_RITMO_FICHA[modelo.ritmo]}</dd>
              </div>
              <div className={styles.fichaLinha}>
                <dt>Quem entra</dt>
                <dd>{LABELS_ACESSO_FICHA[modelo.acesso ?? "fechado"]}</dd>
              </div>
            </dl>
          </>
        ) : null}
        <div className={styles.acoes}>
          {modelo ? (
            <Link
              href={hrefReutilizarRota(roleId)}
              className={styles.botaoPrimario}
              data-foco-inicial
            >
              <span className="material-symbols-outlined" aria-hidden>
                content_copy
              </span>
              Reutilizar
            </Link>
          ) : null}
          <button type="button" className={styles.botaoSecundario} onClick={onFechar}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
