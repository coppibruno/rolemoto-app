"use client";

import { BotaoApagarCatalogo } from "@/components/catalogo/BotaoApagarCatalogo";
import styles from "../confirmacao-role.module.css";

type Props = {
  titulo: string;
  saidaFutura: boolean;
  cancelando: boolean;
  erroAcao: string | null;
  onVoltar: () => void;
  onApagar: () => void;
  onPedirVaga: () => void;
};

export const EstadoAdminRole = ({
  titulo,
  saidaFutura,
  cancelando,
  erroAcao,
  onVoltar,
  onApagar,
  onPedirVaga,
}: Props) => (
  <div className={styles.estado}>
    <span className="material-symbols-outlined" aria-hidden>
      admin_panel_settings
    </span>
    <p className={styles.estadoTitulo}>{titulo}</p>
    <p className={styles.estadoTexto}>Como administrador, você pode apagar este rolê.</p>
    <BotaoApagarCatalogo
      rotulo="Apagar rolê"
      ocupado={cancelando}
      erro={erroAcao}
      onApagar={onApagar}
    />
    {saidaFutura ? (
      <button
        type="button"
        className={styles.botaoEstado}
        onClick={onPedirVaga}
        disabled={cancelando}
      >
        Pedir vaga
      </button>
    ) : null}
    <button type="button" className={styles.botaoEstado} onClick={onVoltar}>
      Voltar ao feed
    </button>
  </div>
);
