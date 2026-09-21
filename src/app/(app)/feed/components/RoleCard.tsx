"use client";

import Link from "next/link";
import type { RoleFeedItem } from "@/types/role";
import { BlocoParticipantes } from "@/components/participantes/BlocoParticipantes";
import { BotaoParticipar } from "./BotaoParticipar";
import { CapaRole } from "./CapaRole";
import { OrganizadorRole } from "./OrganizadorRole";
import { RotaRole } from "./RotaRole";
import styles from "../feed.module.css";

type Props = {
  role: RoleFeedItem;
};

export const RoleCard = ({ role }: Props) => {
  const descricao = role.descricao.trim();
  const href = `/r/${role.id}`;

  return (
    <article className={styles.card}>
      <Link
        href={href}
        className={styles.cardDetalheLink}
        aria-label={`Ver detalhes de ${role.titulo}`}
      />
      <CapaRole
        titulo={role.titulo}
        fotoCapaUrl={role.fotoCapaUrl}
        ritmo={role.ritmo}
        distanciaPartidaKm={role.distanciaPartidaKm}
        distanciaRotaKm={role.distanciaRotaKm}
        dataHoraSaida={role.dataHoraSaida}
      />
      <div className={styles.cardCorpo}>
        <RotaRole
          localSaida={role.localSaida}
          destinoFinal={role.destinoFinal}
          dataHoraSaida={role.dataHoraSaida}
        />
        {descricao ? <p className={styles.descricao}>{descricao}</p> : null}
        <div className={`${styles.linhaOrganizacao} ${styles.cardDetalheAcao}`}>
          <OrganizadorRole criador={role.criador} />
          <BlocoParticipantes
            tipo="role"
            id={role.id}
            participantes={role.participantes}
          />
        </div>
        <div className={`${styles.cardAcoes} ${styles.cardDetalheAcao}`}>
          <BotaoParticipar id={role.id} criadorId={role.criadorId} />
        </div>
      </div>
    </article>
  );
};
