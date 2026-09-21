"use client";

import type { RolePublico } from "@/types/role-publico";
import { CabecalhoDetalhe } from "@/components/detalhe/CabecalhoDetalhe";
import { useAuth } from "@/hooks/useAuth";
import { useCompartilharConvite } from "../hooks/useCompartilharConvite";
import { CabecalhoPublico } from "./CabecalhoPublico";

type Props = {
  role: RolePublico;
};

export const CabecalhoConviteRole = ({ role }: Props) => {
  const { firebaseUser, loading } = useAuth();
  const dados = {
    id: role.id,
    titulo: role.titulo,
    dataHoraSaida: role.dataHoraSaida,
    localSaidaEndereco: role.localSaidaEndereco,
    localSaidaNome: role.localSaidaNome,
  };
  const { compartilhar, feedback } = useCompartilharConvite(dados);
  const logado = Boolean(firebaseUser);

  if (!loading && logado) {
    return (
      <CabecalhoDetalhe
        titulo={role.titulo}
        onCompartilhar={() => void compartilhar()}
        feedback={feedback}
      />
    );
  }

  return (
    <CabecalhoPublico
      roleId={role.id}
      onCompartilhar={() => void compartilhar()}
      feedback={feedback}
      loading={loading}
    />
  );
};
