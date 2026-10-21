"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { CabecalhoPerfil } from "./CabecalhoPerfil";
import { FormularioPerfil } from "./FormularioPerfil";
import { ToastSucesso } from "./ToastSucesso";
import { VisaoPerfil } from "./VisaoPerfil";
import styles from "../perfil.module.css";

export const TelaPerfil = () => {
  const { usuario } = useAuth();
  const [editando, setEditando] = useState(false);
  const [salvo, setSalvo] = useState(false);

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
      <CabecalhoPerfil fotoUrl={usuario.fotoUrl} nome={usuario.nome} />
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
