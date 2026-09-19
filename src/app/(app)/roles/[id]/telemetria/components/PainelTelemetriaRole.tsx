"use client";

import Link from "next/link";
import { COPY_TELEMETRIA } from "../constants";
import { BotaoTelemetriaRole } from "./BotaoTelemetriaRole";
import { PainelGravacaoAtiva } from "./PainelGravacaoAtiva";
import { ResumoTelemetriaRole } from "./ResumoTelemetriaRole";
import { useTelemetriaRole } from "../hooks/useTelemetriaRole";
import styles from "../telemetria-role.module.css";

type Props = {
  roleId: string;
  elegivel: boolean;
};

export const PainelTelemetriaRole = ({ roleId, elegivel }: Props) => {
  const t = useTelemetriaRole(roleId, elegivel);

  if (!elegivel || t.fase === "carregando") return null;

  const metricas = t.salvo ?? t.pendente;

  return (
    <div className={styles.painel}>
      {t.fase === "web" ? (
        <p className={styles.avisoWeb}>{COPY_TELEMETRIA.web}</p>
      ) : null}

      {t.sessaoOutroRole ? (
        <p className={styles.aviso}>
          {COPY_TELEMETRIA.orfa}{" "}
          <Link href={`/roles/${t.sessaoOutroRole.roleId}/participar`}>
            Abrir rolê
          </Link>
        </p>
      ) : null}

      {t.fase === "educacao" ? (
        <div className={styles.educacao}>
          <p className={styles.educacaoTitulo}>{COPY_TELEMETRIA.educacaoTitulo}</p>
          <p className={styles.educacaoCorpo}>{COPY_TELEMETRIA.educacaoCorpo}</p>
          <BotaoTelemetriaRole
            label={COPY_TELEMETRIA.educacaoCta}
            disabled={t.ocupado}
            onClick={() => void t.iniciar()}
          />
        </div>
      ) : null}

      {t.fase === "gravando" && t.sessao ? (
        <PainelGravacaoAtiva iniciadoEm={t.sessao.iniciadoEm} />
      ) : null}

      {metricas && (t.fase === "resumo" || t.fase === "pendente") ? (
        <ResumoTelemetriaRole metricas={metricas} />
      ) : null}

      {t.erro ? (
        <p className={styles.erro} role="alert">
          {t.erro}
        </p>
      ) : null}

      {t.erro === COPY_TELEMETRIA.permissao ? (
        <BotaoTelemetriaRole
          label={COPY_TELEMETRIA.abrirAjustes}
          secundario
          onClick={() => void t.abrirAjustes()}
        />
      ) : null}

      {t.fase === "idle" ? (
        <BotaoTelemetriaRole
          label={COPY_TELEMETRIA.iniciar}
          disabled={t.ocupado || Boolean(t.sessaoOutroRole)}
          onClick={t.pedirInicio}
        />
      ) : null}

      {t.fase === "web" ? (
        <BotaoTelemetriaRole
          label={COPY_TELEMETRIA.iniciar}
          disabled
          onClick={() => undefined}
        />
      ) : null}

      {t.fase === "gravando" ? (
        <BotaoTelemetriaRole
          label={COPY_TELEMETRIA.finalizar}
          disabled={t.ocupado}
          onClick={() => void t.finalizar()}
        />
      ) : null}

      {t.fase === "pendente" ? (
        <BotaoTelemetriaRole
          label={COPY_TELEMETRIA.salvarDeNovo}
          disabled={t.ocupado}
          onClick={() => void t.tentarSalvar()}
        />
      ) : null}
    </div>
  );
};
