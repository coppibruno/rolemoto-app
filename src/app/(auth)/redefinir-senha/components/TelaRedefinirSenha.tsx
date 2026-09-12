"use client";

import { useEffect } from "react";
import { useRedefinirSenha } from "../hooks/useRedefinirSenha";
import { CabecalhoRedefinirSenha } from "./CabecalhoRedefinirSenha";
import { CardHeroRedefinir } from "./CardHeroRedefinir";
import { EstadoLinkInvalido } from "./EstadoLinkInvalido";
import { FormularioNovaSenha } from "./FormularioNovaSenha";
import styles from "../redefinir-senha.module.css";

type Props = {
  oobCode: string;
  mode: string;
};

export const TelaRedefinirSenha = ({ oobCode, mode }: Props) => {
  const { estado, email, enviando, exito, erro, submeter } = useRedefinirSenha(
    oobCode,
    mode,
  );

  useEffect(() => {
    if (estado !== "invalido") return;
    document.querySelector<HTMLElement>("[data-foco-inicial]")?.focus();
  }, [estado]);

  return (
    <div className={styles.tela}>
      <CabecalhoRedefinirSenha focarVoltar={estado === "invalido"} />
      <div className={styles.corpo}>
        {estado === "verificando" ? (
          <div className={styles.spinner} aria-busy="true" />
        ) : null}
        {estado === "invalido" ? <EstadoLinkInvalido /> : null}
        {estado === "form" ? (
          <>
            <CardHeroRedefinir email={email} />
            <FormularioNovaSenha
              enviando={enviando}
              exito={exito}
              erro={erro}
              onSubmit={submeter}
            />
          </>
        ) : null}
      </div>
    </div>
  );
};
