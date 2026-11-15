"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { CabecalhoFeed } from "@/app/(app)/feed/components/CabecalhoFeed";
import { FormularioPerfil } from "./FormularioPerfil";
import { ToastSucesso } from "./ToastSucesso";
import { VisaoPerfil } from "./VisaoPerfil";
import styles from "../perfil.module.css";

export const TelaPerfil = () => {
  const { usuario, recarregarPerfil } = useAuth();
  const [editando, setEditando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    void recarregarPerfil();
  }, [recarregarPerfil]);

  const abrirEdicao = useCallback(() => {
    setSalvo(false);
    setEditando(true);
    window.scrollTo({ top: 0 });
  }, []);

  const aoSalvar = useCallback(() => {
    setEditando(false);
    setSalvo(true);
    window.scrollTo({ top: 0 });
  }, []);

  const fecharToast = useCallback(() => setSalvo(false), []);

  if (!usuario) {
    return null;
  }

  return (
    <div className={styles.tela}>
      <CabecalhoFeed />
      {editando ? (
        <FormularioPerfil
          usuario={usuario}
          onSalvo={aoSalvar}
          onCancelar={() => setEditando(false)}
        />
      ) : (
        <VisaoPerfil usuario={usuario} onEditar={abrirEdicao} />
      )}
      <ToastSucesso visivel={salvo} onFechar={fecharToast} />
    </div>
  );
};
