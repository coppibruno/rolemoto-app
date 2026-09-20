"use client";

import { CabecalhoDetalhe } from "@/components/detalhe/CabecalhoDetalhe";
import { TITULO_PAGINA } from "../constants";
import { useCompartilharEvento } from "../hooks/useCompartilharEvento";

type Props = {
  id: string;
  titulo: string;
};

export const CabecalhoDetalheEvento = ({ id, titulo }: Props) => {
  const { compartilhar, feedback } = useCompartilharEvento(titulo, id);
  return (
    <CabecalhoDetalhe
      titulo={TITULO_PAGINA}
      onCompartilhar={() => void compartilhar()}
      feedback={feedback}
    />
  );
};
