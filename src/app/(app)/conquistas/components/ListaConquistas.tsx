"use client";

import type { ConquistaAdmin } from "@/types/conquista";
import { INTRO_SUBTITULO } from "../constants";
import { ItemConquista } from "./ItemConquista";
import styles from "../conquistas.module.css";

type Props = {
  itens: ConquistaAdmin[];
  carregando: boolean;
  erro: string | null;
  onNova: () => void;
  onAbrir: (item: ConquistaAdmin) => void;
  onRecarregar: () => void;
};

export const ListaConquistas = ({
  itens,
  carregando,
  erro,
  onNova,
  onAbrir,
  onRecarregar,
}: Props) => (
  <section className={styles.conteudo}>
    <p className={styles.intro}>{INTRO_SUBTITULO}</p>
    <button type="button" className={styles.cta} onClick={onNova}>
      <span className="material-symbols-outlined" aria-hidden>
        add_location_alt
      </span>
      Nova conquista
    </button>
    {carregando ? <p className={styles.status}>Carregando conquistas…</p> : null}
    {erro ? (
      <div className={styles.erroGeral} role="alert">
        <span>{erro}</span>
        <button type="button" className={styles.botaoTexto} onClick={onRecarregar}>
          Tentar de novo
        </button>
      </div>
    ) : null}
    {!carregando && !erro ? (
      <ul className={styles.lista}>
        {itens.map((item) => (
          <li key={item.id}>
            <ItemConquista item={item} onAbrir={() => onAbrir(item)} />
          </li>
        ))}
      </ul>
    ) : null}
  </section>
);
