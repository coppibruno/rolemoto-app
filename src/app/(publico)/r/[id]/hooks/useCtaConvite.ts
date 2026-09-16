"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  urlLoginComNext,
  urlPrimeiroAcessoComNext,
} from "@/lib/destino-pos-auth";
import type { RolePublico } from "@/types/role-publico";
import { pedirPermissaoERegistrar } from "@/app/(app)/hooks/useRegistroFcm";
import { COPY_CTA, COPY_CTA_SUB, COPY_ENCERRADO, COPY_GERENCIAR } from "../constants";

export const useCtaConvite = (role: Pick<RolePublico, "id" | "dataHoraSaida" | "criador">) => {
  const { firebaseUser, usuario, loading } = useAuth();
  const router = useRouter();
  const encerrado = Date.parse(role.dataHoraSaida) < Date.now();
  const autenticado = Boolean(firebaseUser) && Boolean(usuario);
  const souCriador = autenticado && firebaseUser?.uid === role.criador.uid;
  const destinoParticipar = `/roles/${role.id}/participar`;

  const acionar = () => {
    if (encerrado || loading) return;
    if (!firebaseUser) {
      router.push(urlLoginComNext(destinoParticipar));
      return;
    }
    if (!usuario) {
      router.push(urlPrimeiroAcessoComNext(destinoParticipar));
      return;
    }
    if (souCriador) {
      router.push(`/aprovacoes?role=${role.id}`);
      return;
    }
    void pedirPermissaoERegistrar();
    router.push(destinoParticipar);
  };

  const label = souCriador ? COPY_GERENCIAR : COPY_CTA;
  const subtitulo = encerrado
    ? COPY_ENCERRADO
    : souCriador
      ? null
      : COPY_CTA_SUB;

  return {
    acionar,
    disabled: encerrado || loading,
    encerrado,
    autenticado,
    mostrarLinksAuth: !loading && !autenticado,
    label,
    subtitulo,
  };
};
