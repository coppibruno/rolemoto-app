"use client";

import { useState } from "react";
import { useFocoModal } from "@/hooks/useFocoModal";
import { ApiError } from "@/lib/api";
import {
  MOTIVOS_DENUNCIA,
  ROTULOS_MOTIVO,
  type AlvoDenuncia,
  type MotivoDenuncia,
} from "@/types/moderacao";
import { moderacaoService } from "../services/moderacao.service";
import styles from "../moderacao.module.css";

type Props = {
  alvoTipo: AlvoDenuncia;
  alvoId: string;
  onFechar: () => void;
  onEnviado: (mensagem: string) => void;
};

export const SheetDenuncia = ({
  alvoTipo,
  alvoId,
  onFechar,
  onEnviado,
}: Props) => {
  const folhaRef = useFocoModal(onFechar);
  const [motivo, setMotivo] = useState<MotivoDenuncia | null>(null);
  const [detalhes, setDetalhes] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const enviar = async () => {
    if (!motivo || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      await moderacaoService.denunciar({
        alvoTipo,
        alvoId,
        motivo,
        detalhes: detalhes.trim() || undefined,
      });
      onEnviado("Recebemos sua denúncia. Vamos analisar.");
      onFechar();
    } catch (e) {
      const mensagem =
        e instanceof ApiError ? e.message : "Não foi possível enviar";
      setErro(mensagem);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div
        ref={folhaRef}
        className={styles.folha}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-denuncia"
        onClick={(evento) => evento.stopPropagation()}
      >
        <span className={styles.grip} aria-hidden />
        <h2 id="titulo-denuncia" className={styles.tituloFolha}>
          Denunciar
        </h2>
        <div className={styles.chips} role="group" aria-label="Motivo">
          {MOTIVOS_DENUNCIA.map((item) => (
            <button
              key={item}
              type="button"
              className={`${styles.chip} ${motivo === item ? styles.chipAtivo : ""}`}
              aria-pressed={motivo === item}
              onClick={() => setMotivo(item)}
            >
              {ROTULOS_MOTIVO[item]}
            </button>
          ))}
        </div>
        <textarea
          className={styles.campo}
          aria-label="Detalhes"
          placeholder={
            motivo === "outro"
              ? "Conte o que aconteceu (obrigatório)"
              : "Detalhes (opcional)"
          }
          value={detalhes}
          maxLength={280}
          onChange={(evento) => setDetalhes(evento.target.value)}
          data-foco-inicial
        />
        {erro ? (
          <p role="alert" style={{ margin: 0, color: "var(--error)", fontSize: 13 }}>
            {erro}
          </p>
        ) : null}
        <button
          type="button"
          className={styles.cta}
          disabled={!motivo || enviando}
          onClick={() => void enviar()}
        >
          Enviar
        </button>
      </div>
    </div>
  );
};
