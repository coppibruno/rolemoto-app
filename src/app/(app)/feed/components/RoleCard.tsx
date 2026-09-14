"use client";

import type { RoleFeedItem } from "@/types/role";
import { BotaoParticipar } from "./BotaoParticipar";
import { BotaoCompartilharRole } from "./BotaoCompartilharRole";
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
        <OrganizadorRole criador={role.criador} />
        <div className={styles.cardAcoes}>
          <BotaoParticipar id={role.id} criadorId={role.criadorId} />
          <BotaoCompartilharRole
            dados={{
              id: role.id,
              titulo: role.titulo,
              dataHoraSaida: role.dataHoraSaida,
              localSaidaEndereco: role.localSaida.endereco,
              localSaidaNome: role.localSaida.nome,
            }}
          />
        </div>
      </div>
    </article>
  );
};
