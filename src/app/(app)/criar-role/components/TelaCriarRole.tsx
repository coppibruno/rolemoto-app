"use client";

import { useAuth } from "@/hooks/useAuth";
import { CabecalhoCriarRole } from "./CabecalhoCriarRole";
import { FormularioCriarRole } from "./FormularioCriarRole";
import { IntroBriefing } from "./IntroBriefing";
import styles from "../criar-role.module.css";

type Props = {
  origemId?: string;
};

export const TelaCriarRole = ({ origemId }: Props) => {
  const { usuario } = useAuth();
  const modoClone = Boolean(origemId);

  if (!usuario) {
    return null;
  }

  return (
    <div className={styles.tela}>
      <CabecalhoCriarRole
        fotoUrl={usuario.fotoUrl}
        nome={usuario.nome}
        modoClone={modoClone}
      />
      <IntroBriefing modoClone={modoClone} />
      <FormularioCriarRole origemId={origemId} />
    </div>
  );
};
