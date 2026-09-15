"use client";

import { useAuth } from "@/hooks/useAuth";
import type { ModoCriarRole } from "../types";
import { CabecalhoCriarRole } from "./CabecalhoCriarRole";
import { FormularioCriarRole } from "./FormularioCriarRole";
import { IntroBriefing } from "./IntroBriefing";
import styles from "../criar-role.module.css";

type Props = {
  origemId?: string;
  editarId?: string;
};

export const TelaCriarRole = ({ origemId, editarId }: Props) => {
  const { usuario } = useAuth();
  const modo: ModoCriarRole = editarId ? "editar" : origemId ? "clonar" : "criar";

  if (!usuario) {
    return null;
  }

  return (
    <div className={styles.tela}>
      <CabecalhoCriarRole
        fotoUrl={usuario.fotoUrl}
        nome={usuario.nome}
        modo={modo}
      />
      <IntroBriefing modo={modo} />
      <FormularioCriarRole origemId={origemId} editarId={editarId} modo={modo} />
    </div>
  );
};
