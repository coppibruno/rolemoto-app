"use client";

import type { EventoFeedItem } from "@/types/evento";
import { EstadoCarregando } from "./EstadoCarregando";
import { EstadoVazio } from "./EstadoVazio";
import { EventoCard } from "./EventoCard";
import styles from "../feed.module.css";

type Props = {
  itens: EventoFeedItem[];
  carregando: boolean;
  erro: string | null;
  semPonto: boolean;
  onTentarDeNovo: () => void;
};

export const ListaEventos = ({
  itens,
  carregando,
  erro,
  semPonto,
  onTentarDeNovo,
}: Props) => {
  const mostrarVazio = !semPonto && !carregando && !erro && itens.length === 0;

  return (
    <section
      id="painel-eventos"
      role="tabpanel"
      aria-labelledby="tab-eventos"
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
      {mostrarVazio ? <EstadoVazio aba="eventos" /> : null}
      {!carregando && !erro
        ? itens.map((evento) => <EventoCard key={evento.id} evento={evento} />)
        : null}
    </section>
  );
};
