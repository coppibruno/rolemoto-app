"use client";

import { CabecalhoFeed } from "@/app/(app)/feed/components/CabecalhoFeed";
import { useConfirmacaoParticipacao } from "../hooks/useConfirmacaoParticipacao";
import { usePreferenciaNotificar } from "../hooks/usePreferenciaNotificar";
import { EstadoCarregando } from "./EstadoCarregando";
import { EstadoErro } from "./EstadoErro";
import { EstadoOrganizador } from "./EstadoOrganizador";
import { FundoDetalheRole } from "./FundoDetalheRole";
import { OverlayConfirmacao } from "./OverlayConfirmacao";
import { SheetConfirmacao } from "./SheetConfirmacao";
import styles from "../confirmacao-role.module.css";

type Props = {
  roleId: string;
};

export const TelaConfirmacaoRole = ({ roleId }: Props) => {
  const {
    carregando,
    cancelando,
    detalhe,
    estado,
    erro,
    erroAcao,
    voltarAoFeed,
    cancelarPedido,
  } = useConfirmacaoParticipacao(roleId);

  const preferencia = usePreferenciaNotificar(
    roleId,
    detalhe?.minhaParticipacao?.notificar ?? true,
    estado === "aguardando",
  );

  const erroSheet = erroAcao ?? preferencia.erro;

  return (
    <div className={styles.tela}>
      <CabecalhoFeed />

      {carregando ? <EstadoCarregando /> : null}
      {erro ? <EstadoErro mensagem={erro} onVoltar={voltarAoFeed} /> : null}
      {estado === "organizador" ? (
        <EstadoOrganizador roleId={roleId} onVoltar={voltarAoFeed} />
      ) : null}

      {detalhe && estado && estado !== "organizador" ? (
        <>
          <FundoDetalheRole detalhe={detalhe} />
          <OverlayConfirmacao onFechar={voltarAoFeed}>
            <SheetConfirmacao
              detalhe={detalhe}
              estado={estado}
              erroAcao={erroSheet}
              notificar={preferencia.notificar}
              salvandoNotificar={preferencia.salvando}
              cancelando={cancelando}
              onVoltar={voltarAoFeed}
              onAlternarNotificar={preferencia.alternar}
              onCancelar={cancelarPedido}
            />
          </OverlayConfirmacao>
        </>
      ) : null}
    </div>
  );
};
