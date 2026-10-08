"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { CabecalhoTelemetria } from "@/components/telemetria/CabecalhoTelemetria";
import { DashboardTelemetria } from "@/components/telemetria/DashboardTelemetria";
import styles from "@/components/telemetria/telemetria.module.css";
import { BotaoCompartilharTelemetria } from "./BotaoCompartilharTelemetria";
import { ModalCompartilharTelemetria } from "./ModalCompartilharTelemetria";
import { useCompartilharTelemetria } from "../hooks/useCompartilharTelemetria";
import { useTelemetriaDetalhe } from "../hooks/useTelemetriaDetalhe";

type Props = {
  id: string;
};

export const TelaTelemetriaDetalhe = ({ id }: Props) => {
  const { usuario } = useAuth();
  const { doc, carregando, erro } = useTelemetriaDetalhe(id);
  const eDono = Boolean(doc && usuario && doc.usuarioId === usuario.uid);
  const apelido = usuario?.apelido?.trim() ?? "";
  const dadosShare = useMemo(() => {
    if (!doc || !eDono) return null;
    return {
      titulo: doc.titulo,
      apelido,
      encerradoEm: doc.encerradoEm,
      distanciaKm: doc.distanciaKm,
      tempoSegundos: doc.tempoSegundos,
      velocidadeMaxKmh: doc.velocidadeMaxKmh,
      velocidadeMediaKmh: doc.velocidadeMediaKmh,
      pontoInicio: doc.pontoInicio,
      pontoFim: doc.pontoFim,
      tracado: doc.tracado,
    };
  }, [apelido, doc, eDono]);
  const share = useCompartilharTelemetria(dadosShare);

  return (
    <div className={styles.tela}>
      <CabecalhoTelemetria
        titulo="Telemetria"
        hrefVoltar="/perfil"
        onCompartilhar={eDono ? share.abrir : undefined}
        compartilhando={share.ocupado}
      />
      <div className={styles.conteudo}>
        {carregando ? (
          <p className={styles.statusHint}>Carregando dashboard…</p>
        ) : null}
        {erro ? (
          <p className={styles.erro} role="alert">
            {erro}
          </p>
        ) : null}
        {!carregando && !erro && !doc ? (
          <div className={styles.vazio}>
            <span className="material-symbols-outlined">explore_off</span>
            <p className={styles.vazioTitulo}>Telemetria não encontrada</p>
            <p>Este passeio não existe ou foi removido.</p>
          </div>
        ) : null}
        {doc ? (
          <>
            <DashboardTelemetria
              titulo={doc.titulo}
              encerradoEm={doc.encerradoEm}
              distanciaKm={doc.distanciaKm}
              tempoSegundos={doc.tempoSegundos}
              velocidadeMaxKmh={doc.velocidadeMaxKmh}
              velocidadeMediaKmh={doc.velocidadeMediaKmh}
              pontoInicio={doc.pontoInicio}
              pontoFim={doc.pontoFim}
              tracado={doc.tracado}
            />
            {eDono ? (
              <BotaoCompartilharTelemetria
                ocupado={share.ocupado}
                onCompartilhar={share.abrir}
              />
            ) : null}
            {share.aberto ? (
              <ModalCompartilharTelemetria
                previewUrl={share.previewUrl}
                ocupado={share.ocupado}
                onCompartilhar={() => void share.compartilhar()}
                onSalvar={() => void share.salvar()}
                onFechar={share.fechar}
              />
            ) : null}
            {share.feedback ? (
              <p className={styles.toast} role="status">
                {share.feedback}
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
};
