"use client";

import { DashboardTelemetria } from "@/components/telemetria/DashboardTelemetria";
import { SeletorVisibilidade } from "@/components/telemetria/SeletorVisibilidade";
import { FotosVisita } from "@/app/(app)/avaliar/components/FotosVisita";
import type { useFotosVisita } from "@/app/(app)/avaliar/hooks/useFotosVisita";
import type { RoleTelemetriaCreate } from "@/types/role-telemetria";
import styles from "@/components/telemetria/telemetria.module.css";

type Props = {
  dados: RoleTelemetriaCreate;
  fotos: ReturnType<typeof useFotosVisita>;
  titulo: string;
  ocupado: boolean;
  online: boolean;
  onTitulo: (valor: string) => void;
  onPublica: (publica: boolean) => void;
  onSalvar: () => void;
  onDescartar: () => void;
};

export const ResumoPreSave = ({
  dados,
  fotos,
  titulo,
  ocupado,
  online,
  onTitulo,
  onPublica,
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
        tracado={dados.tracado}
        tracadoVelocidades={dados.tracadoVelocidades}
        tituloEditavel={{ valor: titulo, onMudar: onTitulo }}
      />
      <SeletorVisibilidade
        publica={Boolean(dados.publica)}
        desabilitado={ocupado}
        onMudar={onPublica}
      />
      <FotosVisita
        titulo="Fotos do passeio"
        fotos={fotos.fotos}
        urlsRemotas={fotos.urlsRemotas}
        onRemoverRemota={ocupado ? undefined : fotos.removerRemota}
        podeAnexar={fotos.podeAnexar && !ocupado}
        erroFoto={fotos.erroFoto}
        inputRef={fotos.inputRef}
        onAnexar={fotos.anexar}
        onRemover={fotos.remover}
        onAbrirSeletor={fotos.abrirSeletor}
      />
      {!online ? (
        <p className={styles.copyOffline}>
          Sem internet — o passeio fica neste celular até enviar.
        </p>
      ) : null}
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
