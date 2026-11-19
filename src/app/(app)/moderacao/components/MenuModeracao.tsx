"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
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

type PosicaoMenu = { top: number; right: number };

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
  const [posicao, setPosicao] = useState<PosicaoMenu | null>(null);
  const [denunciando, setDenunciando] = useState(false);
  const [bloqueando, setBloqueando] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [montado, setMontado] = useState(false);
  const raizRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const fechar = (evento: PointerEvent) => {
      const alvo = evento.target as Node;
      if (raizRef.current?.contains(alvo)) return;
      if (menuRef.current?.contains(alvo)) return;
      setAberto(false);
    };
    window.addEventListener("pointerdown", fechar);
    return () => window.removeEventListener("pointerdown", fechar);
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    const reposicionar = () => {
      const rect = botaoRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosicao({
        top: rect.bottom + 4,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };
    reposicionar();
    window.addEventListener("resize", reposicionar);
    window.addEventListener("scroll", reposicionar, true);
    return () => {
      window.removeEventListener("resize", reposicionar);
      window.removeEventListener("scroll", reposicionar, true);
    };
  }, [aberto]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const mostrarToast = (mensagem: string) => setToast(mensagem);

  const alternar = (evento: MouseEvent) => {
    evento.preventDefault();
    evento.stopPropagation();
    if (aberto) {
      setAberto(false);
      return;
    }
    const rect = botaoRef.current?.getBoundingClientRect();
    if (rect) {
      setPosicao({
        top: rect.bottom + 4,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    }
    setAberto(true);
  };

  return (
    <>
      <div className={styles.overflow} ref={raizRef}>
        <button
          ref={botaoRef}
          type="button"
          className={`${styles.botaoOverflow} ${variante === "escuro" ? styles.botaoOverflowEscuro : ""}`}
          aria-label="Mais ações"
          aria-expanded={aberto}
          onClick={alternar}
        >
          <span className="material-symbols-outlined" aria-hidden>
            more_vert
          </span>
        </button>
      </div>
      {montado && aberto && posicao
        ? createPortal(
            <div
              ref={menuRef}
              className={styles.menuPortal}
              role="menu"
              style={{ top: posicao.top, right: posicao.right }}
            >
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
            </div>,
            document.body,
          )
        : null}
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
