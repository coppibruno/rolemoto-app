"use client";

import Link from "next/link";
import { urlLoginComNext } from "@/lib/destino-pos-auth";
import { BotaoParticiparConvite } from "@/app/(publico)/r/[id]/components/BotaoParticiparConvite";
import { COPY_MICROCOPY } from "../constants";
import { useCtaConviteLocal } from "../hooks/useCtaConviteLocal";
import styles from "../../../r/[id]/convite-role.module.css";

type Props = {
  id: string;
};

export const RodapeConversaoLocal = ({ id }: Props) => {
  const cta = useCtaConviteLocal(id);
  const convite = `/l/${id}`;

  return (
    <footer className={styles.rodape}>
      <div className={styles.rodapeInner}>
        <BotaoParticiparConvite
          label={cta.label}
          subtitulo={cta.subtitulo}
          disabled={cta.disabled}
          onClick={cta.acionar}
        />
        {!cta.mostrarLinksAuth ? null : (
          <div className={styles.linksAuth}>
            <Link href={urlLoginComNext(convite)}>
              Já tem conta? <span className={styles.linkDestaque}>Entrar</span>
            </Link>
            <Link href={urlLoginComNext(convite, true)}>Cadastre-se em 1 min</Link>
          </div>
        )}
        <p className={styles.microcopy}>
          <span className="material-symbols-outlined" aria-hidden>
            verified_user
          </span>
          <span>{COPY_MICROCOPY}</span>
        </p>
      </div>
    </footer>
  );
};
