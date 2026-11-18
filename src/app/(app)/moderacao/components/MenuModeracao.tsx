"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  alvoTipoDoContexto,
  rotuloDenunciar,
  type AlvoDenuncia,
  type ContextoModeracao,
} from "@/types/moderacao";
import { ModalBloquear } from "./ModalBloquear";
import { SheetDenuncia } from "./SheetDenuncia";
import styles from "../moderacao.module.css";

type Props = {
  contexto: ContextoModeracao;
  alvoId: string;
  autorUid: string;
  autorApelido: string;
  alvoTipo?: AlvoDenuncia;
  variante?: "padrao" | "escuro";
  onBloqueado?: () => void;
};

export const MenuModeracao = ({
  contexto,
  alvoId,
  autorUid,
  autorApelido,
  alvoTipo,
  variante = "padrao",
  onBloqueado,
}: Props) => {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [denunciando, setDenunciando] = useState(false);
  const [bloqueando, setBloqueando] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const raizRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fechar = (evento: PointerEvent) => {
      if (raizRef.current?.contains(evento.target as Node)) return;
      setAberto(false);
    };
    window.addEventListener("pointerdown", fechar);
    return () => window.removeEventListener("pointerdown", fechar);
  }, [aberto]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const mostrarToast = (mensagem: string) => setToast(mensagem);

  return (
    <>
      <div className={styles.overflow} ref={raizRef}>
        <button
          type="button"
          className={`${styles.botaoOverflow} ${variante === "escuro" ? styles.botaoOverflowEscuro : ""}`}
          aria-label="Mais ações"
          aria-expanded={aberto}
          onClick={(evento) => {
            evento.preventDefault();
            evento.stopPropagation();
            setAberto((atual) => !atual);
          }}
        >
          <span className="material-symbols-outlined" aria-hidden>
            more_vert
          </span>
        </button>
        {aberto ? (
          <div className={styles.menu} role="menu">
            <button
              type="button"
              className={styles.itemMenu}
              role="menuitem"
              onClick={(evento) => {
                evento.preventDefault();
                evento.stopPropagation();
                setAberto(false);
                setDenunciando(true);
              }}
            >
              <span className="material-symbols-outlined" aria-hidden>
                flag
              </span>
              {rotuloDenunciar(contexto)}
            </button>
            <button
              type="button"
              className={`${styles.itemMenu} ${styles.itemPerigo}`}
              role="menuitem"
              onClick={(evento) => {
                evento.preventDefault();
                evento.stopPropagation();
                setAberto(false);
                setBloqueando(true);
              }}
            >
              <span className="material-symbols-outlined" aria-hidden>
                block
              </span>
              {contexto === "perfil" ? "Bloquear" : "Bloquear autor"}
            </button>
          </div>
        ) : null}
      </div>
      {denunciando
        ? createPortal(
            <SheetDenuncia
              alvoTipo={alvoTipo ?? alvoTipoDoContexto(contexto)}
              alvoId={alvoId}
              onFechar={() => setDenunciando(false)}
              onEnviado={mostrarToast}
            />,
            document.body,
          )
        : null}
      {bloqueando
        ? createPortal(
            <ModalBloquear
              uid={autorUid}
              apelido={autorApelido}
              onCancelar={() => setBloqueando(false)}
              onBloqueado={(mensagem) => {
                setBloqueando(false);
                mostrarToast(mensagem);
                onBloqueado?.();
                if (contexto === "perfil") {
                  router.replace("/");
                }
              }}
            />,
            document.body,
          )
        : null}
      {toast
        ? createPortal(
            <div className={styles.toast} role="status">
              {toast}
            </div>,
            document.body,
          )
        : null}
    </>
  );
};
