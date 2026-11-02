"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { arquivoDoVideo } from "@/lib/preparar-foto-story";
import { useCameraAoVivo } from "../hooks/useCameraAoVivo";
import styles from "./camera-story.module.css";

type Props = {
  pedidoInicial: Promise<MediaStream>;
  preparando: boolean;
  onFechar: () => void;
  onFoto: (arquivo: File) => void;
  onGaleria: () => void;
  onSistema: () => void;
};

export const CameraStory = ({
  pedidoInicial,
  preparando,
  onFechar,
  onFoto,
  onGaleria,
  onSistema,
}: Props) => {
  const [erroCaptura, setErroCaptura] = useState<string | null>(null);
  const camera = useCameraAoVivo(pedidoInicial);
  const mensagem = preparando
    ? "Preparando foto…"
    : erroCaptura
      ? erroCaptura
      : !camera.pronto && !camera.falhou
        ? "Abrindo câmera…"
        : null;

  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, []);

  const disparar = () => {
    const video = camera.videoRef.current;
    if (!video || !camera.pronto || preparando) return;
    setErroCaptura(null);
    void arquivoDoVideo(video, camera.frente)
      .then(onFoto)
      .catch(() => setErroCaptura("Não foi possível capturar a foto."));
  };

  return createPortal(
    <div className={styles.tela} role="dialog" aria-modal="true" aria-label="Câmera">
      <video
        ref={camera.videoRef}
        className={camera.frente ? `${styles.video} ${styles.frente}` : styles.video}
        playsInline
        muted
        autoPlay
        aria-hidden
      />
      {camera.falhou ? (
        <div className={styles.falha}>
          <p>Não foi possível usar a câmera aqui.</p>
          <button type="button" className={styles.alternativa} onClick={onSistema}>
            Câmera do celular
          </button>
          <button type="button" className={styles.alternativa} onClick={onGaleria}>
            Escolher da galeria
          </button>
        </div>
      ) : null}
      {mensagem && !camera.falhou ? (
        <p className={erroCaptura ? styles.erro : styles.aviso}>{mensagem}</p>
      ) : null}
      <div className={styles.topo}>
        <button type="button" className={styles.icone} onClick={onFechar} aria-label="Fechar câmera">
          <span className="material-symbols-outlined" aria-hidden>
            close
          </span>
        </button>
      </div>
      <div className={styles.rodape}>
        <button
          type="button"
          className={styles.icone}
          onClick={onGaleria}
          aria-label="Escolher da galeria"
          disabled={preparando}
        >
          <span className="material-symbols-outlined" aria-hidden>
            photo_library
          </span>
        </button>
        <button
          type="button"
          className={styles.disparo}
          onClick={disparar}
          disabled={preparando || !camera.pronto || camera.falhou}
          aria-label="Tirar foto"
        >
          <span className={styles.miolo} />
        </button>
        <button
          type="button"
          className={styles.icone}
          onClick={camera.virar}
          aria-label="Virar câmera"
          disabled={preparando}
        >
          <span className="material-symbols-outlined" aria-hidden>
            cameraswitch
          </span>
        </button>
      </div>
    </div>,
    document.body,
  );
};
