"use client";

import Link from "next/link";
import type { RolePublico } from "@/types/role-publico";
import { urlLoginComNext } from "@/lib/destino-pos-auth";
import { COPY_MICROCOPY } from "../constants";
import { useCtaConvite } from "../hooks/useCtaConvite";
import { BotaoParticiparConvite } from "./BotaoParticiparConvite";
import { EstadoRoleEncerrado } from "./EstadoRoleEncerrado";
import styles from "../convite-role.module.css";

type Props = {
  role: RolePublico;
};

export const RodapeConversao = ({ role }: Props) => {
  const cta = useCtaConvite(role);
  const convite = `/r/${role.id}`;

  return (
    <footer className={styles.rodape}>
      <div className={styles.rodapeInner}>
        {cta.encerrado ? (
          <EstadoRoleEncerrado />
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
