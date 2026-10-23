"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  urlLoginComNext,
  urlPrimeiroAcessoComNext,
} from "@/lib/destino-pos-auth";
import type { EventoPublico } from "@/types/evento-publico";
import { pedirPermissaoERegistrar } from "@/app/(app)/hooks/useRegistroFcm";
import { COPY_CTA, COPY_CTA_SUB, COPY_ENCERRADO, COPY_VER_EVENTO } from "../constants";

const eventoEncerrou = (evento: Pick<EventoPublico, "dataHoraAbertura" | "dataHoraEncerramento">) => {
  const limite = evento.dataHoraEncerramento ?? evento.dataHoraAbertura;
  return Date.parse(limite) <= Date.now();
};

export const useCtaConviteEvento = (
  evento: Pick<EventoPublico, "id" | "dataHoraAbertura" | "dataHoraEncerramento" | "criador">,
) => {
  const { firebaseUser, usuario, loading } = useAuth();
  const router = useRouter();
  const encerrado = eventoEncerrou(evento);
  const autenticado = Boolean(firebaseUser) && Boolean(usuario);
  const souCriador = autenticado && firebaseUser?.uid === evento.criador.uid;
  const destino = `/eventos/${evento.id}`;

  const acionar = () => {
    if (encerrado || loading) return;
    if (!firebaseUser) {
      router.push(urlLoginComNext(destino));
      return;
    }
    if (!usuario) {
      router.push(urlPrimeiroAcessoComNext(destino));
      return;
    }
    void pedirPermissaoERegistrar();
    router.push(destino);
  };

  const label = souCriador ? COPY_VER_EVENTO : COPY_CTA;
  const subtitulo = encerrado ? COPY_ENCERRADO : souCriador ? null : COPY_CTA_SUB;

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
