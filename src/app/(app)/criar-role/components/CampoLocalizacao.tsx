"use client";

import { MapaSelecaoLocalClient } from "@/components/maps/MapaSelecaoLocalClient";
import { ERRO_FORA_DO_SUL } from "@/lib/regiao-sul";
import { HINT_MAPA_AJUSTE, HINT_MAPA_VAZIO } from "../constants";
import type { useCampoLocalizacao } from "../hooks/useCampoLocalizacao";
import { SugestoesEndereco } from "./SugestoesEndereco";
import styles from "../criar-role.module.css";

type Campo = ReturnType<typeof useCampoLocalizacao>;

type Props = {
  id: string;
  label: string;
  icone: string;
  placeholder: string;
  placeholderNome: string;
  mostrarGps?: boolean;
  campo: Campo;
  erro?: string;
  desabilitado?: boolean;
};

const textoGps = (status: Campo["gpsStatus"], erroGps?: string) => {
  if (status === "buscando") return "Buscando...";
  if (status === "fixado") return "Fixado!";
  if (status === "erro") {
    return erroGps === ERRO_FORA_DO_SUL ? "Fora do Sul" : "Sem GPS";
  }
  return "Meu GPS";
};

export const CampoLocalizacao = ({
  id,
  label,
  icone,
  placeholder,
  placeholderNome,
  mostrarGps,
  campo,
  erro,
  desabilitado,
}: Props) => {
  const erroId = `${id}-erro`;
  const nomeId = `${id}-nome`;
  const mensagem = erro ?? campo.erroGps;

  return (
    <div className={`${styles.cartao} ${mensagem ? styles.cartaoErro : ""}`}>
      <div className={styles.labelLinha}>
        <label htmlFor={id} className={styles.label}>
          <span className="material-symbols-outlined" aria-hidden>
            {icone}
          </span>
          {label}
        </label>
        {mostrarGps ? (
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
            {textoGps(campo.gpsStatus, campo.erroGps)}
          </button>
        ) : null}
      </div>
      <div className={styles.localRelativo}>
        <input
          id={id}
          type="text"
          className={`${styles.input} ${mensagem ? styles.inputErro : ""}`}
          value={
            campo.resolvendoEndereco && !campo.valor.endereco.trim()
              ? ""
              : campo.valor.endereco
          }
          onChange={(e) => campo.aoDigitar(e.target.value)}
          placeholder={
            campo.resolvendoEndereco
              ? "Buscando endereço do ponto…"
              : placeholder
          }
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
      <div className={styles.mapaInterativo}>
        <MapaSelecaoLocalClient
          lat={campo.valor.lat}
          lng={campo.valor.lng}
          vooId={campo.vooId}
          onMoverPonto={campo.atualizarDoMapa}
          desabilitado={desabilitado}
          hintVazio={HINT_MAPA_VAZIO}
          hintAjuste={HINT_MAPA_AJUSTE}
        />
      </div>
      <label htmlFor={nomeId} className={styles.labelNome}>
        Nome do local <span className={styles.labelOpcional}>(opcional)</span>
      </label>
      <input
        id={nomeId}
        type="text"
        className={styles.input}
        value={campo.valor.nome}
        onChange={(e) => campo.aoDigitarNome(e.target.value)}
        placeholder={placeholderNome}
        maxLength={60}
        disabled={desabilitado}
        autoComplete="off"
      />
      {mensagem ? (
        <p id={erroId} className={styles.erroCampo} role="alert">
          {mensagem}
        </p>
      ) : null}
    </div>
  );
};
