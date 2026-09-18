"use client";

import type { useCampoEnderecoLocal } from "../hooks/useCampoEnderecoLocal";
import { PLACEHOLDER_ENDERECO } from "../constants";
import { SugestoesEndereco } from "./SugestoesEndereco";
import styles from "../criar-local.module.css";

type Campo = ReturnType<typeof useCampoEnderecoLocal>;

type Props = {
  campo: Campo;
  erro?: string;
  desabilitado?: boolean;
};

const textoGps = (status: Campo["gpsStatus"]) => {
  if (status === "buscando") return "Buscando ponto…";
  if (status === "fixado") return "Ponto detectado";
  return "Usar Meu GPS (Detectar Ponto)";
};

export const CampoEnderecoLocal = ({ campo, erro, desabilitado }: Props) => {
  const erroId = "endereco-local-erro";
  const mensagem = erro ?? campo.erroGps;

  return (
    <div className={`${styles.cartao} ${mensagem ? styles.cartaoErro : ""}`}>
      <label htmlFor="endereco-local" className={styles.label}>
        Endereço Completo & Rodovia *
      </label>
      <div className={styles.localRelativo}>
        <div className={styles.campoIcone}>
          <span className={`material-symbols-outlined ${styles.iconeInput}`} aria-hidden>
            pin_drop
          </span>
          <input
            id="endereco-local"
            type="text"
            className={`${styles.input} ${mensagem ? styles.inputErro : ""}`}
            value={campo.endereco}
            onChange={(e) => campo.aoDigitar(e.target.value)}
            placeholder={PLACEHOLDER_ENDERECO}
            disabled={desabilitado}
            autoComplete="off"
            aria-invalid={Boolean(mensagem)}
            aria-describedby={mensagem ? erroId : undefined}
            aria-autocomplete="list"
            onBlur={() => window.setTimeout(campo.fecharLista, 150)}
          />
        </div>
        {campo.listaAberta ? (
          <SugestoesEndereco
            termo={campo.endereco}
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
      {mensagem ? (
        <p id={erroId} className={styles.erroCampo} role="alert">
          {mensagem}
        </p>
      ) : null}
    </div>
  );
};
