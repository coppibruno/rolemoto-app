"use client";

import type { EventoPublico } from "@/types/evento-publico";
import { CabecalhoDetalhe } from "@/components/detalhe/CabecalhoDetalhe";
import { useAuth } from "@/hooks/useAuth";
import { CabecalhoPublico } from "@/app/(publico)/r/[id]/components/CabecalhoPublico";
import { useCompartilharConviteEvento } from "../hooks/useCompartilharConviteEvento";

type Props = {
  evento: EventoPublico;
};

export const CabecalhoConviteEvento = ({ evento }: Props) => {
  const { firebaseUser, loading } = useAuth();
  const dados = {
    id: evento.id,
    titulo: evento.titulo,
    dataHoraAbertura: evento.dataHoraAbertura,
    dataHoraEncerramento: evento.dataHoraEncerramento,
    localNome: evento.localNome,
    localEndereco: evento.localEndereco,
  };
  const { compartilhar, feedback } = useCompartilharConviteEvento(dados);
  const logado = Boolean(firebaseUser);

  if (!loading && logado) {
    return (
      <CabecalhoDetalhe
        titulo={evento.titulo}
        onCompartilhar={() => void compartilhar()}
        feedback={feedback}
      />
    );
  }

  return (
    <CabecalhoPublico
      caminhoConvite={`/e/${evento.id}`}
      onCompartilhar={() => void compartilhar()}
      feedback={feedback}
      loading={loading}
    />
  );
};
