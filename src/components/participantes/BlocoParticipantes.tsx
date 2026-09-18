"use client";

import { useState } from "react";
import type { ParticipantesBloco } from "@/types/participante";
import type { TipoAlvoParticipantes } from "@/types/participante";
import { ModalParticipantes } from "./ModalParticipantes";
import { PilhaParticipantes } from "./PilhaParticipantes";

type Props = {
  tipo: TipoAlvoParticipantes;
  id: string;
  participantes: ParticipantesBloco | null | undefined;
  compacto?: boolean;
};

export const BlocoParticipantes = ({
  tipo,
  id,
  participantes,
  compacto,
}: Props) => {
  const [aberto, setAberto] = useState(false);
  const total = participantes?.total ?? 0;
  const destaques = participantes?.destaques ?? [];

  if (total <= 0) {
    return null;
  }

  return (
    <>
      <PilhaParticipantes
        tipo={tipo}
        total={total}
        destaques={destaques}
        compacto={compacto}
        onAbrirLista={() => setAberto(true)}
      />
      {aberto ? (
        <ModalParticipantes
          tipo={tipo}
          id={id}
          onFechar={() => setAberto(false)}
        />
      ) : null}
    </>
  );
};
