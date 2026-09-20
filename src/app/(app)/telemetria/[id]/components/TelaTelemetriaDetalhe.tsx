"use client";

import { useAuth } from "@/hooks/useAuth";
import { CabecalhoTelemetria } from "@/components/telemetria/CabecalhoTelemetria";
import { DashboardTelemetria } from "@/components/telemetria/DashboardTelemetria";
import styles from "@/components/telemetria/telemetria.module.css";
import { BotaoCompartilharTelemetria } from "./BotaoCompartilharTelemetria";
import { useTelemetriaDetalhe } from "../hooks/useTelemetriaDetalhe";

type Props = {
  id: string;
};

export const TelaTelemetriaDetalhe = ({ id }: Props) => {
  const { usuario } = useAuth();
  const { doc, carregando, erro } = useTelemetriaDetalhe(id);
  const eDono = Boolean(doc && usuario && doc.usuarioId === usuario.uid);

  return (
    <div className={styles.tela}>
      <CabecalhoTelemetria titulo="Telemetria" hrefVoltar="/perfil" />
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
            />
            {eDono ? (
              <BotaoCompartilharTelemetria id={doc.id} titulo={doc.titulo} />
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
};
