"use client";

import type { RoleFeedItem } from "@/types/role";
import { EstadoCarregando } from "./EstadoCarregando";
import { EstadoVazio } from "./EstadoVazio";
import { RoleCard } from "./RoleCard";
import styles from "../feed.module.css";

type Props = {
  itens: RoleFeedItem[];
  carregando: boolean;
  erro: string | null;
  semPonto: boolean;
  onTentarDeNovo: () => void;
};

const rotuloContador = (n: number) =>
  n === 1 ? "1 encontrado" : `${n} encontrados`;

export const ListaRoles = ({
  itens,
  carregando,
  erro,
  semPonto,
  onTentarDeNovo,
}: Props) => {
  const mostrarVazio = !semPonto && !carregando && !erro && itens.length === 0;

  return (
    <section className={styles.lista} aria-busy={carregando}>
      <div className={styles.listaCabecalho}>
        <h2 className={styles.listaTitulo}>Rolês na Região</h2>
        <span className={styles.listaContador} aria-live="polite">
          {semPonto || carregando ? "—" : rotuloContador(itens.length)}
        </span>
      </div>

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
      {mostrarVazio ? <EstadoVazio /> : null}
      {!carregando && !erro
        ? itens.map((role) => <RoleCard key={role.id} role={role} />)
        : null}
    </section>
  );
};
