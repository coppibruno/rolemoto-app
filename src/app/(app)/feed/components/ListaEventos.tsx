"use client";

import type { EventoFeedItem } from "@/types/evento";
import type { PontoFeed, RaioKm } from "../types";
import { EstadoCarregando } from "./EstadoCarregando";
import { EstadoVazio } from "./EstadoVazio";
import { EventoCard } from "./EventoCard";
import { FaixaStories } from "./FaixaStories";
import styles from "../feed.module.css";

type Props = {
  itens: EventoFeedItem[];
  carregando: boolean;
  erro: string | null;
  semPonto: boolean;
  ponto: PontoFeed | null;
  raioKm: RaioKm;
  onTentarDeNovo: () => void;
};

export const ListaEventos = ({
  itens,
  carregando,
  erro,
  semPonto,
  ponto,
  raioKm,
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
      <FaixaStories aba="eventos" ponto={ponto} raioKm={raioKm} />
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
