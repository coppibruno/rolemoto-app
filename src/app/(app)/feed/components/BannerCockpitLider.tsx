"use client";

import Link from "next/link";
import type { ResumoAprovacoes } from "@/types/aprovacao";
import {
  rotuloPilotos,
  rotuloRoles,
} from "@/app/(app)/aprovacoes/constants";
import styles from "../feed.module.css";

type Props = {
  resumo: ResumoAprovacoes;
};

export const BannerCockpitLider = ({ resumo }: Props) => {
  if (resumo.pendentes > 0) {
    return (
      <Link href="/aprovacoes" className={styles.bannerLider}>
        <span className={styles.bannerPulso} aria-hidden />
        <span className={styles.bannerTexto}>
          <strong>{rotuloPilotos(resumo.pendentes)}</strong> na fila de triagem
          em {rotuloRoles(resumo.rolesComPendentes)}{" "}
          {resumo.rolesComPendentes === 1 ? "ativo" : "ativos"}
        </span>
        <span className="material-symbols-outlined" aria-hidden>
          chevron_right
        </span>
      </Link>
    );
  }

  if (resumo.aceitos > 0) {
    return (
      <Link href="/aprovacoes?status=aceito" className={styles.bannerLider}>
        <span className={styles.bannerPulso} aria-hidden />
        <span className={styles.bannerTexto}>
          <strong>{rotuloPilotos(resumo.aceitos)}</strong> confirmados nos seus
          rolês
        </span>
        <span className="material-symbols-outlined" aria-hidden>
          chevron_right
        </span>
      </Link>
    );
  }

  return null;
};
