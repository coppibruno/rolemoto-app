"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { PlayerStories } from "@/app/(app)/components/PlayerStories";
import { usePlayerDetalhe } from "@/app/(app)/stories/hooks/usePlayerDetalhe";
import { useTemStories } from "@/app/(app)/stories/hooks/useTemStories";
import styles from "./avatar-stories.module.css";

type Props = {
  uid: string;
  fotoUrl: string;
  nome: string;
  tamanho: "header" | "cartao";
};

export const AvatarStories = ({ uid, fotoUrl, nome, tamanho }: Props) => {
  const router = useRouter();
  const { usuario } = useAuth();
  const tem = useTemStories(uid);
  const [menu, setMenu] = useState(false);
  const player = usePlayerDetalhe(tem);
  const href = usuario?.uid === uid ? "/perfil" : `/perfil/${uid}`;

  useEffect(() => {
    if (!menu) return;
    const fechar = () => setMenu(false);
    window.addEventListener("pointerdown", fechar);
    return () => window.removeEventListener("pointerdown", fechar);
  }, [menu]);

  const abrir = () => {
    if (!tem) {
      router.push(href);
      return;
    }
    setMenu((atual) => !atual);
  };

  return (
    <span className={styles.wrap}>
      <button
        type="button"
        className={styles.botao}
        aria-label={tem ? `Stories de ${nome}` : `Perfil de ${nome}`}
        aria-expanded={menu}
        onPointerDown={(evento) => evento.stopPropagation()}
        onClick={abrir}
      >
        {fotoUrl ? (
          <img
            src={fotoUrl}
            alt=""
            className={`${styles.foto} ${styles[tamanho]} ${tem ? styles.verde : ""}`}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className={`${styles.vazio} ${styles[tamanho]} ${tem ? styles.verde : ""}`} aria-hidden>
            <span className="material-symbols-outlined">person</span>
          </span>
        )}
      </button>
      {menu ? (
        <span className={styles.menu} onPointerDown={(evento) => evento.stopPropagation()}>
          <button
            type="button"
            className={styles.opcao}
            onClick={() => {
              setMenu(false);
              router.push(href);
            }}
          >
            Visualizar perfil
          </button>
          <button
            type="button"
            className={styles.opcao}
            onClick={() => {
              setMenu(false);
              player.abrir(null);
            }}
          >
            Visualizar Stories
          </button>
        </span>
      ) : null}
      <PlayerStories
        aberto={player.aberto}
        alvo={{ tipo: "usuario", id: uid }}
        destaqueId={player.destaqueId}
        onFechar={player.fechar}
      />
    </span>
  );
};
