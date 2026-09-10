"use client";

import { useBuscaEndereco } from "../hooks/useBuscaEndereco";
import { useFocoModal } from "@/hooks/useFocoModal";
import styles from "../feed.module.css";

type Props = {
  onFechar: () => void;
  onUsarGps: () => void | Promise<void>;
  onEscolher: (lat: number, lng: number, label: string) => void;
};

export const SeletorLocalizacao = ({ onFechar, onUsarGps, onEscolher }: Props) => {
  const sheetRef = useFocoModal(onFechar);
  const { texto, setTexto, sugestoes, buscando } = useBuscaEndereco();

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div
        ref={sheetRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-seletor-local"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.sheetCabecalho}>
          <h2 id="titulo-seletor-local" className={styles.sheetTitulo}>
            Alterar localização
          </h2>
          <button
            type="button"
            className={styles.botaoFechar}
            onClick={onFechar}
            aria-label="Fechar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <button type="button" className={styles.botaoGps} onClick={onUsarGps}>
          <span className="material-symbols-outlined">my_location</span>
          Usar minha localização
        </button>
        <input
          className={styles.sheetBusca}
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar endereço ou cidade"
          aria-label="Buscar endereço"
        />
        <ul className={styles.sugestoes} role="listbox">
          {sugestoes.map((item) => (
            <li key={`${item.lat}-${item.lng}-${item.label}`}>
              <button
                type="button"
                className={styles.sugestao}
                role="option"
                onClick={() => onEscolher(item.lat, item.lng, item.label)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
        {buscando ? (
          <p className={styles.sugestaoVazia}>Buscando…</p>
        ) : texto.trim().length >= 3 && sugestoes.length === 0 ? (
          <p className={styles.sugestaoVazia}>Nenhum endereço encontrado</p>
        ) : null}
      </div>
    </div>
  );
};
