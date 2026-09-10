"use client";

import type { RoleFeedItem } from "@/types/role";
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

  return (
    <article className={styles.card}>
      <CapaRole
        titulo={role.titulo}
        fotoCapaUrl={role.fotoCapaUrl}
        ritmo={role.ritmo}
        distanciaKm={role.distanciaKm}
        dataHoraSaida={role.dataHoraSaida}
      />
      <div className={styles.cardCorpo}>
        <RotaRole
          localSaida={role.localSaida}
          destinoFinal={role.destinoFinal}
          dataHoraSaida={role.dataHoraSaida}
        />
        {descricao ? <p className={styles.descricao}>{descricao}</p> : null}
        <OrganizadorRole criador={role.criador} />
        <BotaoParticipar id={role.id} criadorId={role.criadorId} />
      </div>
    </article>
  );
};
