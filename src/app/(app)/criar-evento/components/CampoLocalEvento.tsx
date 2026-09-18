"use client";

import type { useCampoLocalEvento } from "../hooks/useCampoLocalEvento";
import { PLACEHOLDER_LOCAL } from "../constants";
import { PreviewMapaEstatico } from "./PreviewMapaEstatico";
import { SugestoesEndereco } from "./SugestoesEndereco";
import styles from "../criar-evento.module.css";

type Campo = ReturnType<typeof useCampoLocalEvento>;

type Props = {
  campo: Campo;
  erro?: string;
  desabilitado?: boolean;
};

const textoGps = (status: Campo["gpsStatus"]) => {
  if (status === "buscando") return "…";
  if (status === "fixado") return "OK";
  return "GPS";
};

export const CampoLocalEvento = ({ campo, erro, desabilitado }: Props) => {
  const erroId = "local-evento-erro";
  const mensagem = erro ?? campo.erroGps;

  return (
    <div className={styles.campo}>
      <label htmlFor="local-evento" className={styles.label}>
        Local do Evento <span className={styles.obrigatorio}>*</span>
      </label>
      <div className={styles.localLinha}>
        <div className={styles.localRelativo}>
          <span className={`material-symbols-outlined ${styles.iconeInput}`} aria-hidden>
            pin_drop
          </span>
          <input
            id="local-evento"
            type="text"
            className={`${styles.input} ${styles.inputComIcone} ${
              mensagem ? styles.inputErro : ""
            }`}
            value={campo.valor.endereco}
            onChange={(e) => campo.aoDigitar(e.target.value)}
            placeholder={PLACEHOLDER_LOCAL}
            disabled={desabilitado}
            autoComplete="off"
            aria-invalid={Boolean(mensagem)}
            aria-describedby={mensagem ? erroId : undefined}
            aria-autocomplete="list"
            onBlur={() => window.setTimeout(campo.fecharLista, 150)}
          />
          {campo.listaAberta ? (
            <SugestoesEndereco
              termo={campo.valor.endereco}
              sugestoes={campo.sugestoes}
              buscando={campo.buscando}
              onEscolher={campo.escolher}
            />
          ) : null}
        </div>
        <button
          type="button"
          className={styles.botaoGps}
          onClick={() => void campo.usarGps()}
          disabled={desabilitado || campo.gpsStatus === "buscando"}
          aria-label="Usar minha localização atual"
        >
          <span
            className={`material-symbols-outlined ${
              campo.gpsStatus === "buscando" ? styles.girando : ""
            }`}
          >
            my_location
          </span>
          {textoGps(campo.gpsStatus)}
        </button>
      </div>
      <PreviewMapaEstatico lat={campo.valor.lat} lng={campo.valor.lng} />
      {mensagem ? (
        <p id={erroId} className={styles.erroCampo} role="alert">
          {mensagem}
        </p>
      ) : null}
    </div>
  );
};
