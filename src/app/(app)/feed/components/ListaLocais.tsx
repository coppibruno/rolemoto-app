"use client";

import type { LocalFeedItem } from "@/types/local";
import { EstadoCarregando } from "./EstadoCarregando";
import { EstadoVazio } from "./EstadoVazio";
import { LocalCard } from "./LocalCard";
import styles from "../feed.module.css";

type Props = {
  itens: LocalFeedItem[];
  carregando: boolean;
  erro: string | null;
  semPonto: boolean;
  onTentarDeNovo: () => void;
};

export const ListaLocais = ({
  itens,
  carregando,
  erro,
  semPonto,
  onTentarDeNovo,
}: Props) => {
  const mostrarVazio = !semPonto && !carregando && !erro && itens.length === 0;

  return (
    <section
      id="painel-locais"
      role="tabpanel"
      aria-labelledby="tab-locais"
      className={styles.lista}
      aria-busy={carregando}
    >
      {erro ? (
        <div className={styles.erro} role="alert">
          <span className="material-symbols-outlined">wifi_off</span>
          <p className={styles.erroTitulo}>{erro}</p>
          <button type="button" className={styles.botaoTentar} onClick={onTentarDeNovo}>
            Tentar de novo
          </button>
        </div>
      ) : null}

      {carregando ? <EstadoCarregando /> : null}
      {mostrarVazio ? <EstadoVazio aba="locais" /> : null}
      {!carregando && !erro
        ? itens.map((local) => <LocalCard key={local.id} local={local} />)
        : null}
    </section>
  );
};
