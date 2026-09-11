"use client";

import { BotaoCancelarPedido } from "./BotaoCancelarPedido";
import { BotaoNotificacoes } from "./BotaoNotificacoes";
import { BotaoVoltarFeed } from "./BotaoVoltarFeed";
import { ChecklistPrePista } from "./ChecklistPrePista";
import { CorpoSheet } from "./CorpoSheet";
import { MiniCardRole } from "./MiniCardRole";
import { StatusAguardando } from "./StatusAguardando";
import { COPY_SHEET } from "../constants";
import type { RoleDetalhe } from "@/types/role";
import type { EstadoSheet } from "../types";
import styles from "../confirmacao-role.module.css";

type EstadoDialogo = Exclude<EstadoSheet, "organizador">;

type Props = {
  detalhe: RoleDetalhe;
  estado: EstadoDialogo;
  erroAcao: string | null;
  notificar: boolean;
  salvandoNotificar: boolean;
  cancelando: boolean;
  onVoltar: () => void;
  onAlternarNotificar: () => void;
  onCancelar: () => void;
};

export const SheetConfirmacao = ({
  detalhe,
  estado,
  erroAcao,
  notificar,
  salvandoNotificar,
  cancelando,
  onVoltar,
  onAlternarNotificar,
  onCancelar,
}: Props) => {
  const copy = COPY_SHEET[estado];
  const apelido = detalhe.criador.apelido || "piloto";
  const ocupado = cancelando || salvandoNotificar;

  return (
    <div
      className={styles.sheet}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-confirmacao"
      tabIndex={-1}
      data-foco-inicial
    >
      <div className={styles.faixa} />
      <div className={styles.handle} />
      <div className={styles.statusLinha}>
        {estado === "aguardando" ? (
          <StatusAguardando />
        ) : (
          <div className={styles.statusPill}>
            <span
              className={`${styles.statusPonto} ${estado === "recusado" ? styles.statusPontoRecusado : ""}`}
            />
            <span className={styles.statusTexto}>{copy.faixa}</span>
          </div>
        )}
        <div className={styles.statusIcone}>
          <span className={`material-symbols-outlined ${styles.iconeFill}`}>
            sports_motorsports
          </span>
        </div>
      </div>
      <h2 id="titulo-confirmacao" className={styles.sheetTitulo}>
        {copy.titulo}
      </h2>
      <CorpoSheet estado={estado} apelido={apelido} />
      <MiniCardRole detalhe={detalhe} />
      {estado === "aguardando" ? <ChecklistPrePista /> : null}
      <div className={styles.acoes}>
        {erroAcao ? <p className={styles.erroAcao}>{erroAcao}</p> : null}
        <BotaoVoltarFeed onClick={onVoltar} />
        {estado !== "recusado" ? (
          <div className={styles.secundarios}>
            <BotaoNotificacoes
              ligado={notificar}
              disabled={ocupado}
              onClick={onAlternarNotificar}
            />
            <BotaoCancelarPedido disabled={ocupado} onClick={onCancelar} />
          </div>
        ) : null}
      </div>
    </div>
  );
};
