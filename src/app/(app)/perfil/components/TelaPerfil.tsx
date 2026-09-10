"use client";

import { useAuth } from "@/hooks/useAuth";
import { CabecalhoPerfil } from "./CabecalhoPerfil";
import { FormularioPerfil } from "./FormularioPerfil";
import { HistoricoPistas } from "./HistoricoPistas";
import styles from "../perfil.module.css";

export const TelaPerfil = () => {
  const { usuario } = useAuth();

  if (!usuario) {
    return null;
  }

  return (
    <div className={styles.tela}>
      <CabecalhoPerfil fotoUrl={usuario.fotoUrl} nome={usuario.nome} />
      <FormularioPerfil usuario={usuario} antesDasAcoes={<HistoricoPistas />} />
    </div>
  );
};
