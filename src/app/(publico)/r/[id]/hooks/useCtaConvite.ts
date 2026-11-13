"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { participacaoService } from "@/app/(app)/roles/[id]/participar/services/participacao.service";
import { pedirPermissaoERegistrar } from "@/app/(app)/hooks/useRegistroFcm";
import { useAuth } from "@/hooks/useAuth";
import {
  urlLoginComNext,
  urlPrimeiroAcessoComNext,
} from "@/lib/destino-pos-auth";
import type { RolePublico } from "@/types/role-publico";
import {
  COPY_CTA,
  COPY_CTA_SUB,
  COPY_ENCERRADO,
  COPY_GERENCIAR,
  COPY_JA_CONFIRMADO,
  COPY_JA_PENDENTE,
  COPY_JA_PENDENTE_SUB,
} from "../constants";

type Vinculo = "carregando" | "livre" | "pendente" | "confirmado" | "recusado";

const jaNoRole = (vinculo: Vinculo) =>
  vinculo === "carregando" || vinculo === "pendente" || vinculo === "confirmado";

export const useCtaConvite = (role: Pick<RolePublico, "id" | "dataHoraSaida" | "criador">) => {
  const { firebaseUser, usuario, loading } = useAuth();
  const router = useRouter();
  const [vinculo, setVinculo] = useState<Vinculo>("carregando");
  const encerrado = Date.parse(role.dataHoraSaida) < Date.now();
  const autenticado = Boolean(firebaseUser) && Boolean(usuario);
  const souCriador = autenticado && firebaseUser?.uid === role.criador.uid;
  const destinoParticipar = `/roles/${role.id}/participar`;

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser || !usuario || souCriador || encerrado) {
      setVinculo("livre");
      return;
    }

    let cancelado = false;
    setVinculo("carregando");
    participacaoService
      .buscarDetalhe(role.id)
      .then((detalhe) => {
        if (cancelado) return;
        const pedido = detalhe.minhaParticipacao;
        if (!pedido) {
          setVinculo("livre");
          return;
        }
        if (pedido.recusadoEm) {
          setVinculo("recusado");
          return;
        }
        setVinculo(pedido.aceito ? "confirmado" : "pendente");
      })
      .catch(() => {
        if (!cancelado) setVinculo("livre");
      });

    return () => {
      cancelado = true;
    };
  }, [encerrado, firebaseUser, loading, role.id, souCriador, usuario]);

  const acionar = () => {
    if (encerrado || loading || (autenticado && !souCriador && jaNoRole(vinculo))) return;
    if (!firebaseUser) {
      router.push(urlLoginComNext(destinoParticipar));
      return;
    }
    if (!usuario) {
      router.push(urlPrimeiroAcessoComNext(destinoParticipar));
      return;
    }
    if (souCriador) {
      router.push(`/roles/${role.id}/gerenciar`);
      return;
    }
    void pedirPermissaoERegistrar();
    router.push(destinoParticipar);
  };

  const label = souCriador
    ? COPY_GERENCIAR
    : vinculo === "confirmado"
      ? COPY_JA_CONFIRMADO
      : vinculo === "pendente"
        ? COPY_JA_PENDENTE
        : COPY_CTA;
  const subtitulo = encerrado
    ? COPY_ENCERRADO
    : souCriador || vinculo === "confirmado"
      ? null
      : vinculo === "pendente"
        ? COPY_JA_PENDENTE_SUB
        : COPY_CTA_SUB;

  return {
    acionar,
    disabled: encerrado || loading || (autenticado && !souCriador && jaNoRole(vinculo)),
    encerrado,
    autenticado,
    mostrarLinksAuth: !loading && !autenticado,
    label,
    subtitulo,
  };
};
