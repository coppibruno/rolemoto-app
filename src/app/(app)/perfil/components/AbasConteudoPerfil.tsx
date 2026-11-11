"use client";

import { useId, useState, type ReactNode } from "react";
import styles from "../fotos-perfil.module.css";

type Aba = "fotos" | "historico";

const ABAS: { id: Aba; icone: string; rotulo: string }[] = [
  { id: "fotos", icone: "grid_view", rotulo: "Fotos" },
  { id: "historico", icone: "history", rotulo: "Histórico" },
];

type Props = {
  fotos: ReactNode;
  historico: ReactNode;
};

export const AbasConteudoPerfil = ({ fotos, historico }: Props) => {
  const [aba, setAba] = useState<Aba>("fotos");
  const base = useId();
  const paineis: Record<Aba, ReactNode> = { fotos, historico };

  return (
    <section className={styles.conteudo}>
      <div className={styles.abas} role="tablist" aria-label="Perfil">
        {ABAS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`${base}-aba-${item.id}`}
            aria-controls={`${base}-painel-${item.id}`}
            aria-selected={aba === item.id}
            aria-label={item.rotulo}
            className={aba === item.id ? styles.abaAtiva : styles.aba}
            onClick={() => setAba(item.id)}
          >
            <span className="material-symbols-outlined" aria-hidden>
              {item.icone}
            </span>
          </button>
        ))}
      </div>
      {ABAS.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${base}-painel-${item.id}`}
          aria-labelledby={`${base}-aba-${item.id}`}
          hidden={aba !== item.id}
        >
          {paineis[item.id]}
        </div>
      ))}
    </section>
  );
};
