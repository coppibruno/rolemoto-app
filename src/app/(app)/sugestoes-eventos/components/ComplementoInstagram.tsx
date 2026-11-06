"use client";

import type { useCartaoSugestaoEvento } from "../hooks/useCartaoSugestaoEvento";
import { PLACEHOLDER_LINK_INGRESSO } from "../../criar-evento/constants";
import styles from "../sugestoes-eventos.module.css";

type Estado = ReturnType<typeof useCartaoSugestaoEvento>;

type Props = {
  idPrefix: string;
  estado: Estado;
};

export const ComplementoInstagram = ({ idPrefix, estado }: Props) => {
  const extra = estado.complemento;
  if (!extra.precisaLugar && !extra.precisaLink) return null;
  const travado = estado.enviando !== null;
  const linkDigitado = extra.link.trim().length > 0;

  return (
    <div className={styles.campos}>
      {extra.precisaLugar ? (
        <label className={styles.campo} htmlFor={`${idPrefix}-lugar`}>
          <span className={styles.label}>Endereço no Sul</span>
          <div className={styles.localRelativo}>
            <input
              id={`${idPrefix}-lugar`}
              className={`${styles.input} ${extra.erroLugar ? styles.inputErro : ""}`}
              value={extra.endereco}
              onChange={(event) => extra.aoDigitar(event.target.value)}
              onFocus={extra.abrirLista}
              onBlur={() => window.setTimeout(extra.fecharLista, 150)}
              disabled={travado}
              autoComplete="off"
              aria-autocomplete="list"
              placeholder="Endereço, galpão ou ponto de encontro"
            />
            {extra.listaAberta ? (
              <ul className={styles.sugestoes} role="listbox">
                {extra.sugestoes.map((item) => (
                  <li key={`${item.lat}-${item.lng}`}>
                    <button
                      type="button"
                      className={styles.sugestao}
                      role="option"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => extra.escolher(item)}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
                {extra.buscando && extra.sugestoes.length === 0 ? (
                  <li className={styles.sugestaoVazia}>Buscando…</li>
                ) : null}
                {!extra.buscando && extra.sugestoes.length === 0 ? (
                  <li className={styles.sugestaoVazia}>Nenhum endereço encontrado</li>
                ) : null}
              </ul>
            ) : null}
          </div>
          {extra.erroLugar ? <span className={styles.erroCampo}>{extra.erroLugar}</span> : null}
          {!extra.erroLugar && extra.avisoLugar ? (
            <span className={styles.aviso}>{extra.avisoLugar}</span>
          ) : null}
        </label>
      ) : null}
      {extra.precisaLink ? (
        <label className={styles.campo} htmlFor={`${idPrefix}-ingresso`}>
          <span className={styles.label}>Link do ingresso</span>
          <input
            id={`${idPrefix}-ingresso`}
            className={`${styles.input} ${linkDigitado && extra.avisoLink ? styles.inputErro : ""}`}
            value={extra.link}
            onChange={(event) => extra.setLink(event.target.value)}
            disabled={travado}
            inputMode="url"
            placeholder={PLACEHOLDER_LINK_INGRESSO}
          />
          {extra.avisoLink ? (
            <span className={linkDigitado ? styles.erroCampo : styles.aviso}>{extra.avisoLink}</span>
          ) : null}
        </label>
      ) : null}
    </div>
  );
};
