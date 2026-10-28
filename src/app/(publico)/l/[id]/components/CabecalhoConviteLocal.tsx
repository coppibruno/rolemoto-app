"use client";

import type { DadosConviteLocal } from "@/lib/convite-local";
import { CabecalhoDetalhe } from "@/components/detalhe/CabecalhoDetalhe";
import { useAuth } from "@/hooks/useAuth";
import { CabecalhoPublico } from "@/app/(publico)/r/[id]/components/CabecalhoPublico";
import { useCompartilharLocal } from "@/app/(app)/locais/[id]/hooks/useCompartilharLocal";

type Props = {
  convite: DadosConviteLocal;
};

export const CabecalhoConviteLocal = ({ convite }: Props) => {
  const { firebaseUser, loading } = useAuth();
  const { compartilhar, feedback } = useCompartilharLocal(convite);

  if (!loading && firebaseUser) {
    return (
      <CabecalhoDetalhe
        titulo={convite.nome}
        onCompartilhar={() => void compartilhar()}
        feedback={feedback}
      />
    );
  }

  return (
    <CabecalhoPublico
      caminhoConvite={`/l/${convite.id}`}
      onCompartilhar={() => void compartilhar()}
      feedback={feedback}
      loading={loading}
    />
  );
};
