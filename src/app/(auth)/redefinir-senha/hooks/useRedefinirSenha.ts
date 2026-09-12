"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { COPY, MIN_SENHA } from "../constants";
import {
  confirmarNovaSenha,
  verificarCodigoReset,
} from "../services/redefinir-senha.service";

export type EstadoTela = "verificando" | "invalido" | "form";

const CODIGOS_INVALIDOS = new Set([
  "auth/expired-action-code",
  "auth/invalid-action-code",
]);

const codigoDe = (error: unknown): string =>
  (error as { code?: string }).code ?? "";

export const useRedefinirSenha = (oobCode: string, mode: string) => {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoTela>("verificando");
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "resetPassword" || !oobCode) {
      setEstado("invalido");
      return;
    }

    let cancelado = false;
    verificarCodigoReset(oobCode)
      .then((resolvido) => {
        if (cancelado) return;
        setEmail(resolvido);
        setEstado("form");
      })
      .catch((error: unknown) => {
        if (cancelado) return;
        if (CODIGOS_INVALIDOS.has(codigoDe(error))) {
          setEstado("invalido");
          return;
        }
        setEstado("invalido");
      });

    return () => {
      cancelado = true;
    };
  }, [oobCode, mode]);

  const submeter = async (senha: string, confirmacao: string) => {
    if (senha !== confirmacao || senha.length < MIN_SENHA || enviando) return;

    setEnviando(true);
    setErro(null);
    try {
      await confirmarNovaSenha(oobCode, senha);
      setExito(true);
      await logout();
      window.setTimeout(() => {
        router.replace("/login?senhaRedefinida=1");
      }, 700);
    } catch (error: unknown) {
      const codigo = codigoDe(error);
      if (CODIGOS_INVALIDOS.has(codigo)) {
        setEstado("invalido");
        return;
      }
      setErro(codigo === "auth/weak-password" ? COPY.senhaFraca : COPY.erroGenerico);
      setEnviando(false);
    }
  };

  return { estado, email, enviando, exito, erro, submeter };
};
