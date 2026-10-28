"use client";

import { CabecalhoDetalhe } from "@/components/detalhe/CabecalhoDetalhe";
import type { DadosConviteLocal } from "@/lib/convite-local";
import { TITULO_PAGINA } from "../constants";
import { useCompartilharLocal } from "../hooks/useCompartilharLocal";

type Props = {
  convite: DadosConviteLocal;
};

export const CabecalhoDetalheLocal = ({ convite }: Props) => {
  const { compartilhar, feedback } = useCompartilharLocal(convite);
  return (
    <CabecalhoDetalhe
      titulo={TITULO_PAGINA}
      onCompartilhar={() => void compartilhar()}
      feedback={feedback}
    />
  );
};
