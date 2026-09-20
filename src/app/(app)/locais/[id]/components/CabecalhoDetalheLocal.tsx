"use client";

import { CabecalhoDetalhe } from "@/components/detalhe/CabecalhoDetalhe";
import { TITULO_PAGINA } from "../constants";
import { useCompartilharLocal } from "../hooks/useCompartilharLocal";

type Props = {
  id: string;
  nome: string;
};

export const CabecalhoDetalheLocal = ({ id, nome }: Props) => {
  const { compartilhar, feedback } = useCompartilharLocal(nome, id);
  return (
    <CabecalhoDetalhe
      titulo={TITULO_PAGINA}
      onCompartilhar={() => void compartilhar()}
      feedback={feedback}
    />
  );
};
