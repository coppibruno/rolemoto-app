"use client";

import { useMeusRoles } from "../hooks/useMeusRoles";
import { useFiltrosMeusRoles } from "../hooks/useFiltrosMeusRoles";
import { useAcaoParticipacaoGaragem } from "../hooks/useAcaoParticipacaoGaragem";
import { AbasMeusRoles } from "./AbasMeusRoles";
import { CabecalhoMeusRoles } from "./CabecalhoMeusRoles";
import { EstadoCarregandoMeusRoles } from "./EstadoCarregandoMeusRoles";
import { EstadoErroMeusRoles } from "./EstadoErroMeusRoles";
import { EstadoVazioMeusRoles } from "./EstadoVazioMeusRoles";
import { IntroGaragem } from "./IntroGaragem";
import { ListaMeusRoles } from "./ListaMeusRoles";
import { SheetFiltrosMeusRoles } from "./SheetFiltrosMeusRoles";
import { TelemetriaGaragem } from "./TelemetriaGaragem";
import styles from "../meus-roles.module.css";

const TELEMETRIA_ZERO = { ativos: 0, analise: 0, asfaltoKm: 0 };
const CONTAGENS_ZERO = { confirmados: 0, aguardando: 0, concluidos: 0 };

export const TelaMeusRoles = () => {
  const { payload, carregando, erro, recarregar } = useMeusRoles();
  const filtros = useFiltrosMeusRoles(payload?.itens ?? []);
  const acao = useAcaoParticipacaoGaragem({ recarregar });
  const vazio = !carregando && !erro && filtros.itensVisiveis.length === 0;

  return (
    <div className={styles.tela}>
      <CabecalhoMeusRoles />
      <div className={styles.corpo}>
        <IntroGaragem
          sheetAberto={filtros.sheetAberto}
          onTune={() => filtros.setSheetAberto(true)}
        />
        <TelemetriaGaragem telemetria={payload?.telemetria ?? TELEMETRIA_ZERO} />
        <AbasMeusRoles
          aba={filtros.filtros.aba}
          contagens={payload?.contagens ?? CONTAGENS_ZERO}
          onSelecionar={filtros.selecionarAba}
        />
        {acao.erroAcao ? (
          <p className={styles.alertaAcao} role="alert">
            {acao.erroAcao}
          </p>
        ) : null}
        {erro ? <EstadoErroMeusRoles onTentar={recarregar} /> : null}
        {carregando ? <EstadoCarregandoMeusRoles /> : null}
        {vazio ? (
          <EstadoVazioMeusRoles aba={filtros.filtros.aba} tuneAtivo={filtros.tuneAtivo} />
        ) : null}
        {!carregando && !erro && filtros.itensVisiveis.length > 0 ? (
          <ListaMeusRoles
            itens={filtros.itensVisiveis}
            processandoId={acao.processandoId}
            onAcao={acao.executar}
          />
        ) : null}
      </div>
      {filtros.sheetAberto ? (
        <SheetFiltrosMeusRoles
          ritmo={filtros.filtros.ritmo}
          papel={filtros.filtros.papel}
          onRitmo={filtros.setRitmo}
          onPapel={filtros.setPapel}
          onLimpar={filtros.limparTune}
          onFechar={() => filtros.setSheetAberto(false)}
        />
      ) : null}
    </div>
  );
};
