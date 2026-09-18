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

export const ListaRoles = ({
  itens,
  carregando,
  erro,
  semPonto,
  onTentarDeNovo,
}: Props) => {
  const mostrarVazio = !semPonto && !carregando && !erro && itens.length === 0;

  return (
    <section
      id="painel-roles"
      role="tabpanel"
      aria-labelledby="tab-roles"
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
      {mostrarVazio ? <EstadoVazio aba="roles" /> : null}
      {!carregando && !erro
        ? itens.map((role) => <RoleCard key={role.id} role={role} />)
        : null}
    </section>
  );
};
