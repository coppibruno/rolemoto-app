"use client";

import Link from "next/link";
import type { EventoPublico } from "@/types/evento-publico";
import { urlLoginComNext } from "@/lib/destino-pos-auth";
import { BotaoParticiparConvite } from "@/app/(publico)/r/[id]/components/BotaoParticiparConvite";
import { COPY_CTA, COPY_ENCERRADO, COPY_MICROCOPY } from "../constants";
import { useCtaConviteEvento } from "../hooks/useCtaConviteEvento";
import styles from "../../../r/[id]/convite-role.module.css";

type Props = {
  evento: EventoPublico;
};

export const RodapeConversaoEvento = ({ evento }: Props) => {
  const cta = useCtaConviteEvento(evento);
  const convite = `/e/${evento.id}`;

  return (
    <footer className={styles.rodape}>
      <div className={styles.rodapeInner}>
        {cta.encerrado ? (
          <button type="button" className={styles.cta} disabled aria-disabled="true">
            <span className={styles.ctaLabel}>{COPY_CTA}</span>
            <span className={styles.ctaSub}>{COPY_ENCERRADO}</span>
          </button>
        ) : (
          <BotaoParticiparConvite
            label={cta.label}
            subtitulo={cta.subtitulo}
            disabled={cta.disabled}
            onClick={cta.acionar}
          />
        )}
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
