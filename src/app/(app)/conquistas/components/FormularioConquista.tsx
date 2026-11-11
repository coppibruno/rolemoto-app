"use client";

import { MapaSelecaoLocalClient } from "@/components/maps/MapaSelecaoLocalClient";
import type { ConquistaAdmin } from "@/types/conquista";
import {
  HINT_MAPA_AJUSTE,
  HINT_MAPA_VAZIO,
  NOME_MAX,
  PLACEHOLDER_NOME,
} from "../constants";
import { useFormularioConquista } from "../hooks/useFormularioConquista";
import { AcaoArquivar } from "./AcaoArquivar";
import { ControleRaio } from "./ControleRaio";
import styles from "../conquistas.module.css";

type Props = {
  inicial: ConquistaAdmin | null;
  onSalvo: (item: ConquistaAdmin) => void;
  onCancelar: () => void;
};

export const FormularioConquista = ({ inicial, onSalvo, onCancelar }: Props) => {
  const form = useFormularioConquista(inicial, onSalvo);

  return (
    <form className={styles.conteudo} onSubmit={(e) => void form.salvar(e)} noValidate>
      <div className={styles.cartao}>
        <label htmlFor="nome-conquista" className={styles.label}>
          Nome *
        </label>
        <input
          id="nome-conquista"
          className={styles.input}
          value={form.nome}
          onChange={(e) => form.setNome(e.target.value)}
          placeholder={PLACEHOLDER_NOME}
          maxLength={NOME_MAX}
          disabled={form.salvando}
          autoComplete="off"
        />
      </div>
      <div className={`${styles.cartao} ${form.erroMapa ? styles.cartaoErro : ""}`}>
        <span className={styles.label}>Pino e círculo *</span>
        <div className={styles.mapa}>
          <MapaSelecaoLocalClient
            lat={form.lat}
            lng={form.lng}
            vooId={0}
            onMoverPonto={form.atualizarDoMapa}
            desabilitado={form.salvando}
            hintVazio={HINT_MAPA_VAZIO}
            hintAjuste={HINT_MAPA_AJUSTE}
            raioMetros={form.raioMetros}
          />
        </div>
        {form.erroMapa ? (
          <p className={styles.erroCampo} role="alert">
            {form.erroMapa}
          </p>
        ) : null}
        <ControleRaio
          valor={form.raioMetros}
          onMudar={form.setRaioMetros}
          desabilitado={form.salvando}
        />
      </div>
      {form.erroGeral ? (
        <p className={styles.erroGeral} role="alert">
          {form.erroGeral}
        </p>
      ) : null}
      <div className={styles.acoes}>
        <button type="submit" className={styles.cta} disabled={!form.podeSalvar}>
          <span className="material-symbols-outlined" aria-hidden>
            save
          </span>
          {form.salvando ? "Salvando…" : "Salvar conquista"}
        </button>
        {form.editando ? <AcaoArquivar form={form} /> : null}
        <button
          type="button"
          className={styles.secundario}
          onClick={onCancelar}
          disabled={form.salvando}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};
