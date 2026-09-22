"use client";

import type { DadosConvite } from "@/lib/convite";
import { useDecisaoPiloto } from "@/app/(app)/aprovacoes/hooks/useDecisaoPiloto";
import { ToastDecisao } from "@/app/(app)/aprovacoes/components/ToastDecisao";
import { useGerenciarRole } from "../hooks/useGerenciarRole";
import { CabecalhoGerenciar } from "./CabecalhoGerenciar";
import { EstadoCarregando } from "./EstadoCarregando";
import { EstadoErro } from "./EstadoErro";
import { ResumoRoleGerenciar } from "./ResumoRoleGerenciar";
import { SecaoAguardando } from "./SecaoAguardando";
import { SecaoConfirmados } from "./SecaoConfirmados";
import styles from "../gerenciar-role.module.css";

type Props = {
  roleId: string;
};

export const TelaGerenciarRole = ({ roleId }: Props) => {
  const gerenciar = useGerenciarRole(roleId);
  const decisao = useDecisaoPiloto({ onDecidido: gerenciar.aplicarDecisao });

  const convite: DadosConvite | null = gerenciar.detalhe
    ? {
        id: gerenciar.detalhe.id,
        titulo: gerenciar.detalhe.titulo,
        dataHoraSaida: gerenciar.detalhe.dataHoraSaida,
        localSaidaEndereco: gerenciar.detalhe.localSaida.endereco,
        localSaidaNome: gerenciar.detalhe.localSaida.nome,
      }
    : null;

  return (
    <div className={styles.tela}>
      {convite ? (
        <CabecalhoGerenciar
          tituloRole={gerenciar.detalhe?.titulo ?? ""}
          convite={convite}
        />
      ) : null}

      <div className={styles.corpo}>
        {gerenciar.carregando ? <EstadoCarregando /> : null}

        {gerenciar.erro && !gerenciar.carregando ? (
          <EstadoErro
            mensagem={gerenciar.erro}
            onVoltar={gerenciar.voltar}
            onTentar={gerenciar.recarregar}
          />
        ) : null}

        {!gerenciar.carregando && !gerenciar.erro && gerenciar.detalhe ? (
          <>
            <ResumoRoleGerenciar
              detalhe={gerenciar.detalhe}
              pendentes={gerenciar.pendentes.length}
              cancelando={gerenciar.cancelando}
              onCancelar={gerenciar.cancelarRole}
            />
            {gerenciar.erroAcao ? (
              <p className={styles.erroAcao} role="alert">
                {gerenciar.erroAcao}
              </p>
            ) : null}
            <SecaoAguardando
              itens={gerenciar.pendentes}
              decidindoId={decisao.decidindoId}
              saindo={decisao.saindo}
              onDecidir={decisao.decidir}
            />
            <SecaoConfirmados itens={gerenciar.confirmados} />
          </>
        ) : null}
      </div>

      <ToastDecisao toast={decisao.toast} onFechar={decisao.fecharToast} />
    </div>
  );
};
