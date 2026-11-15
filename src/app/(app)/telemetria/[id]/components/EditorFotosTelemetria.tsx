"use client";

import { useEffect, useState } from "react";
import { FotosVisita } from "@/app/(app)/avaliar/components/FotosVisita";
import { useFotosVisita } from "@/app/(app)/avaliar/hooks/useFotosVisita";
import { ApiError } from "@/lib/api";
import { uploadFotoTelemetria } from "@/lib/storage";
import styles from "@/components/telemetria/telemetria.module.css";

type Props = {
  uid: string;
  fotosUrls: string[];
  onSalvar: (fotosUrls: string[]) => Promise<void>;
  onFechar: () => void;
};

export const EditorFotosTelemetria = ({ uid, fotosUrls, onSalvar, onFechar }: Props) => {
  const fotos = useFotosVisita();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const { definirRemotas } = fotos;
  const iniciais = fotosUrls.join("\n");

  useEffect(() => {
    definirRemotas(iniciais ? iniciais.split("\n") : []);
  }, [definirRemotas, iniciais]);

  const salvar = async () => {
    if (salvando) return;
    setSalvando(true);
    setErro(null);
    try {
      const urls = await fotos.enviarTodas((file, tipo) => uploadFotoTelemetria(uid, file, tipo));
      await onSalvar(urls);
      fotos.descartarPendentes();
      onFechar();
    } catch (falha) {
      setErro(falha instanceof ApiError ? falha.message : "Não deu para salvar as fotos.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <FotosVisita
        titulo="Fotos do passeio"
        fotos={fotos.fotos}
        urlsRemotas={fotos.urlsRemotas}
        onRemoverRemota={salvando ? undefined : fotos.removerRemota}
        podeAnexar={fotos.podeAnexar && !salvando}
        erroFoto={fotos.erroFoto}
        inputRef={fotos.inputRef}
        onAnexar={fotos.anexar}
        onRemover={fotos.remover}
        onAbrirSeletor={fotos.abrirSeletor}
      />
      {erro ? (
        <p className={styles.erro} role="alert">
          {erro}
        </p>
      ) : null}
      <div className={styles.acoes}>
        <button
          type="button"
          className={styles.cta}
          disabled={salvando}
          onClick={() => void salvar()}
        >
          <span className="material-symbols-outlined">save</span>
          {salvando ? "Salvando…" : "Salvar fotos"}
        </button>
        <button
          type="button"
          className={styles.ctaSecundario}
          disabled={salvando}
          onClick={() => {
            fotos.limpar();
            onFechar();
          }}
        >
          Cancelar
        </button>
      </div>
    </>
  );
};
