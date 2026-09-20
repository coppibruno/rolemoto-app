"use client";

import { DashboardTelemetria } from "@/components/telemetria/DashboardTelemetria";
import type { RoleTelemetriaCreate } from "@/types/role-telemetria";
import styles from "@/components/telemetria/telemetria.module.css";

type Props = {
  dados: RoleTelemetriaCreate;
  titulo: string;
  ocupado: boolean;
  onTitulo: (valor: string) => void;
  onSalvar: () => void;
  onDescartar: () => void;
};

export const ResumoPreSave = ({
  dados,
  titulo,
  ocupado,
  onTitulo,
  onSalvar,
  onDescartar,
}: Props) => {
  return (
    <>
      <DashboardTelemetria
        titulo={titulo}
        encerradoEm={dados.encerradoEm}
        distanciaKm={dados.distanciaKm}
        tempoSegundos={dados.tempoSegundos}
        velocidadeMaxKmh={dados.velocidadeMaxKmh}
        velocidadeMediaKmh={dados.velocidadeMediaKmh}
        pontoInicio={dados.pontoInicio}
        pontoFim={dados.pontoFim}
        tituloEditavel={{ valor: titulo, onMudar: onTitulo }}
      />
      <div className={styles.acoes}>
        <button
          type="button"
          className={styles.cta}
          disabled={ocupado}
          onClick={onSalvar}
        >
          <span className="material-symbols-outlined">save</span>
          Salvar rolê
        </button>
        <button
          type="button"
          className={styles.ctaSecundario}
          disabled={ocupado}
          onClick={onDescartar}
        >
          <span className="material-symbols-outlined">delete</span>
          Descartar
        </button>
      </div>
    </>
  );
};
