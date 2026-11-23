"use client";

import { useId, useState, type ReactNode } from "react";
import styles from "../fotos-perfil.module.css";

type Aba = "fotos" | "historico";

const ABAS_COM_HISTORICO: { id: Aba; icone: string; rotulo: string }[] = [
  { id: "fotos", icone: "grid_view", rotulo: "Fotos" },
  { id: "historico", icone: "history", rotulo: "Histórico" },
];

type Props = {
  fotos: ReactNode;
  /** Omitido no perfil próprio — histórico vive em Meus Rolês. */
  historico?: ReactNode;
};

export const AbasConteudoPerfil = ({ fotos, historico }: Props) => {
  const [aba, setAba] = useState<Aba>("fotos");
  const base = useId();
  const abas = historico ? ABAS_COM_HISTORICO : ABAS_COM_HISTORICO.filter((a) => a.id === "fotos");
  const paineis: Record<Aba, ReactNode> = { fotos, historico: historico ?? null };

  if (!historico) {
    return <section className={styles.conteudo}>{fotos}</section>;
  }

  return (
    <section className={styles.conteudo}>
      <div className={styles.abas} role="tablist" aria-label="Perfil">
        {abas.map((item) => (
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
      {abas.map((item) => (
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
