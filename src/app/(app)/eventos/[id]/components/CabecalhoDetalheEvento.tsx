"use client";

import { CabecalhoDetalhe } from "@/components/detalhe/CabecalhoDetalhe";
import type { DadosConviteEvento } from "@/lib/convite-evento";
import { TITULO_PAGINA } from "../constants";
import { useCompartilharEvento } from "../hooks/useCompartilharEvento";

type Props = {
  convite: DadosConviteEvento;
};

export const CabecalhoDetalheEvento = ({ convite }: Props) => {
  const { compartilhar, feedback } = useCompartilharEvento(convite);
  return (
    <CabecalhoDetalhe
      titulo={TITULO_PAGINA}
      onCompartilhar={() => void compartilhar()}
      feedback={feedback}
    />
  );
};
