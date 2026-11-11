"use client";

import { useAuth } from "@/hooks/useAuth";
import type { Localizacao } from "@/types/role";
import type { ModoCriarRole } from "../types";
import { CabecalhoCriarRole } from "./CabecalhoCriarRole";
import { FormularioCriarRole } from "./FormularioCriarRole";
import { IntroBriefing } from "./IntroBriefing";
import styles from "../criar-role.module.css";

type Props = {
  origemId?: string;
  editarId?: string;
  destinoInicial?: Localizacao;
};

const chaveFormulario = (
  origemId?: string,
  editarId?: string,
  destinoInicial?: Localizacao,
) => {
  if (editarId) return `editar:${editarId}`;
  if (origemId) return `clonar:${origemId}`;
  if (!destinoInicial) return "novo";
  return `destino:${destinoInicial.lat}:${destinoInicial.lng}:${destinoInicial.nome}`;
};

export const TelaCriarRole = ({ origemId, editarId, destinoInicial }: Props) => {
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
      <FormularioCriarRole
        key={chaveFormulario(origemId, editarId, destinoInicial)}
        origemId={origemId}
        editarId={editarId}
        modo={modo}
        destinoInicial={destinoInicial}
      />
    </div>
  );
};
