"use client";

import { useAuth } from "@/hooks/useAuth";
import type { ContagensMeusRoles, ContagensTipoGaragem, TelemetriaMeusRoles } from "@/types/meus-roles";
import { useMeusRoles } from "../hooks/useMeusRoles";
import { useFiltrosMeusRoles } from "../hooks/useFiltrosMeusRoles";
import { useAcaoParticipacaoGaragem } from "../hooks/useAcaoParticipacaoGaragem";
import { useCancelarRole } from "../hooks/useCancelarRole";
import { useAbaTipoGaragem } from "../hooks/useAbaTipoGaragem";
import { useMeusEventosGaragem } from "../hooks/useMeusEventosGaragem";
import { useMeusLocaisGaragem } from "../hooks/useMeusLocaisGaragem";
import { useFiltroAvaliacaoGaragem } from "../hooks/useFiltroAvaliacaoGaragem";
import { TOAST_ROLE_CANCELADO } from "../constants";
import { AbasMeusRoles } from "./AbasMeusRoles";
import { AbasTipoGaragem } from "./AbasTipoGaragem";
import { CabecalhoMeusRoles } from "./CabecalhoMeusRoles";
import { CardPilotoGaragem } from "./CardPilotoGaragem";
import { EstadoCarregandoMeusRoles } from "./EstadoCarregandoMeusRoles";
import { EstadoErroMeusRoles } from "./EstadoErroMeusRoles";
import { EstadoVazioGaragem } from "./EstadoVazioGaragem";
import { EstadoVazioMeusRoles } from "./EstadoVazioMeusRoles";
import { IntroGaragem } from "./IntroGaragem";
import { ListaMeusEventos } from "./ListaMeusEventos";
import { ListaMeusLocais } from "./ListaMeusLocais";
import { ListaMeusRoles } from "./ListaMeusRoles";
import { PillsAvaliacaoGaragem } from "./PillsAvaliacaoGaragem";
import { SheetFiltrosMeusRoles } from "./SheetFiltrosMeusRoles";
import { ToastMeusRoles } from "./ToastMeusRoles";
import styles from "../meus-roles.module.css";

const TELEMETRIA_ZERO: TelemetriaMeusRoles = {
  rolesFeitos: 0,
  eventosParticipados: 0,
  locaisFavoritos: 0,
};

const CONTAGENS_ZERO: ContagensMeusRoles = {
  confirmados: 0,
  aguardando: 0,
  concluidos: 0,
  recusados: 0,
};

const CONTAGENS_TIPO_ZERO: ContagensTipoGaragem = {
  roles: 0,
  eventos: 0,
  locais: 0,
};

export const TelaMeusRoles = () => {
  const { usuario } = useAuth();
  const { payload, carregando, erro, recarregar } = useMeusRoles();
  const { abaTipo, setAbaTipo } = useAbaTipoGaragem();
  const filtros = useFiltrosMeusRoles(payload?.itens ?? []);
  const acao = useAcaoParticipacaoGaragem({ recarregar });
  const cancelarRole = useCancelarRole({ recarregar });

  const eventos = useMeusEventosGaragem(abaTipo === "eventos");
  const locais = useMeusLocaisGaragem(abaTipo === "locais");
  const filtroEventos = useFiltroAvaliacaoGaragem(eventos.itens, "eventos");
  const filtroLocais = useFiltroAvaliacaoGaragem(locais.itens, "locais");

  const processandoId = acao.processandoId ?? cancelarRole.processandoId;
  const erroAcao = acao.erroAcao ?? cancelarRole.erro;

  const vazioRoles =
    abaTipo === "roles" &&
    !carregando &&
    !erro &&
    filtros.itensVisiveis.length === 0;

  const vazioEventos =
    abaTipo === "eventos" &&
    !eventos.carregando &&
    !eventos.erro &&
    filtroEventos.itensFiltrados.length === 0;

  const vazioLocais =
    abaTipo === "locais" &&
    !locais.carregando &&
    !locais.erro &&
    filtroLocais.itensFiltrados.length === 0;

  return (
    <div className={styles.tela}>
      <CabecalhoMeusRoles />
      <div className={styles.corpo}>
        <IntroGaragem
          mostrarTune={abaTipo === "roles"}
          sheetAberto={filtros.sheetAberto}
          onTune={() => filtros.setSheetAberto(true)}
        />
        <CardPilotoGaragem
          usuario={usuario}
          telemetria={payload?.telemetria ?? TELEMETRIA_ZERO}
        />

        <div className={styles.stickyTipo}>
          <AbasTipoGaragem
            aba={abaTipo}
            contagens={payload?.contagensTipo ?? CONTAGENS_TIPO_ZERO}
            onSelecionar={setAbaTipo}
          />
          {abaTipo === "eventos" ? (
            <PillsAvaliacaoGaragem
              pill={filtroEventos.pill}
              contagens={filtroEventos.contagensPill}
              onSelecionar={filtroEventos.setPill}
            />
          ) : null}
          {abaTipo === "locais" ? (
            <PillsAvaliacaoGaragem
              pill={filtroLocais.pill}
              contagens={filtroLocais.contagensPill}
              onSelecionar={filtroLocais.setPill}
            />
          ) : null}
        </div>

        {abaTipo === "roles" ? (
          <>
            <AbasMeusRoles
              aba={filtros.filtros.aba}
              contagens={payload?.contagens ?? CONTAGENS_ZERO}
              onSelecionar={filtros.selecionarAba}
            />
            {erroAcao ? (
              <p className={styles.alertaAcao} role="alert">
                {erroAcao}
              </p>
            ) : null}
            {erro ? <EstadoErroMeusRoles onTentar={recarregar} /> : null}
            {carregando ? <EstadoCarregandoMeusRoles /> : null}
            {vazioRoles ? (
              <EstadoVazioMeusRoles
                aba={filtros.filtros.aba}
                tuneAtivo={filtros.tuneAtivo}
              />
            ) : null}
            {!carregando && !erro && filtros.itensVisiveis.length > 0 ? (
              <ListaMeusRoles
                itens={filtros.itensVisiveis}
                processandoId={processandoId}
                onAcao={acao.executar}
                onCancelarRole={cancelarRole.executar}
              />
            ) : null}
          </>
        ) : null}

        {abaTipo === "eventos" ? (
          <>
            {eventos.erro ? (
              <EstadoErroMeusRoles onTentar={eventos.recarregar} />
            ) : null}
            {eventos.carregando ? <EstadoCarregandoMeusRoles /> : null}
            {vazioEventos ? (
              <EstadoVazioGaragem
                tipo="eventos"
                pill={filtroEventos.pill}
              />
            ) : null}
            {!eventos.carregando &&
            !eventos.erro &&
            filtroEventos.itensFiltrados.length > 0 ? (
              <ListaMeusEventos itens={filtroEventos.itensFiltrados} />
            ) : null}
          </>
        ) : null}

        {abaTipo === "locais" ? (
          <>
            {locais.erro ? (
              <EstadoErroMeusRoles onTentar={locais.recarregar} />
            ) : null}
            {locais.carregando ? <EstadoCarregandoMeusRoles /> : null}
            {vazioLocais ? (
              <EstadoVazioGaragem tipo="locais" pill={filtroLocais.pill} />
            ) : null}
            {!locais.carregando &&
            !locais.erro &&
            filtroLocais.itensFiltrados.length > 0 ? (
              <ListaMeusLocais itens={filtroLocais.itensFiltrados} />
            ) : null}
          </>
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
      <ToastMeusRoles
        visivel={cancelarRole.toast}
        mensagem={TOAST_ROLE_CANCELADO}
        duracaoMs={cancelarRole.toastMs}
        onFechar={cancelarRole.fecharToast}
      />
    </div>
  );
};
