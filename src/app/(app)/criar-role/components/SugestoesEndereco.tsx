"use client";

import { ENDERECO_MIN } from "../constants";
import type { SugestaoEndereco } from "../services/geocode.service";
import styles from "../criar-role.module.css";

type Props = {
  termo: string;
  sugestoes: SugestaoEndereco[];
  buscando: boolean;
  onEscolher: (item: SugestaoEndereco) => void;
};

const unicas = (lista: SugestaoEndereco[]) =>
  lista.filter(
    (item, index) =>
      lista.findIndex(
        (outro) =>
          outro.lat === item.lat &&
          outro.lng === item.lng &&
          outro.label === item.label,
      ) === index,
  );

export const SugestoesEndereco = ({
  termo,
  sugestoes,
  buscando,
  onEscolher,
}: Props) => {
  if (termo.trim().length < ENDERECO_MIN) return null;

  return (
    <ul className={styles.sugestoes} role="listbox">
      {unicas(sugestoes).map((item, index) => (
        <li key={`${item.lat}-${item.lng}-${index}`}>
          <button
            type="button"
            className={styles.sugestao}
            role="option"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onEscolher(item)}
          >
            {item.label}
          </button>
        </li>
      ))}
      {buscando && sugestoes.length === 0 ? (
        <li className={styles.sugestaoVazia}>Buscando…</li>
      ) : null}
      {!buscando && sugestoes.length === 0 ? (
        <li className={styles.sugestaoVazia}>Nenhum endereço encontrado</li>
      ) : null}
    </ul>
  );
};
