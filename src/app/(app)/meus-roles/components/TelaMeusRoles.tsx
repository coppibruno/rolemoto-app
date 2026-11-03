"use client";

import { useState } from "react";
import { useEstadoRetorno } from "@/hooks/useEstadoRetorno";
import type {
  AbaMeusRoles,
  AbaTipoGaragem,
  ContagensMeusRoles,
  ContagensTipoGaragem,
  PapelMeuRole,
  PillAvaliacaoGaragem,
  RecorteLocaisGaragem,
  TelemetriaMeusRoles,
} from "@/types/meus-roles";
import type { RitmoRole } from "@/types/role";
import { useMeusRoles } from "../hooks/useMeusRoles";
import { useFiltrosMeusRoles } from "../hooks/useFiltrosMeusRoles";
import { useAcaoParticipacaoGaragem } from "../hooks/useAcaoParticipacaoGaragem";
import { useCancelarRole } from "../hooks/useCancelarRole";
import { useAbaTipoGaragem } from "../hooks/useAbaTipoGaragem";
import { useMeusEventosGaragem } from "../hooks/useMeusEventosGaragem";
import { useMeusLocaisGaragem } from "../hooks/useMeusLocaisGaragem";
import { useFiltroAvaliacaoGaragem } from "../hooks/useFiltroAvaliacaoGaragem";
import { AbasMeusRoles } from "./AbasMeusRoles";
import { AbasTipoGaragem } from "./AbasTipoGaragem";
import { CabecalhoMeusRoles } from "./CabecalhoMeusRoles";
import { EstadoCarregandoMeusRoles } from "./EstadoCarregandoMeusRoles";
import { EstadoErroMeusRoles } from "./EstadoErroMeusRoles";
import { EstadoVazioGaragem } from "./EstadoVazioGaragem";
import { EstadoVazioMeusRoles } from "./EstadoVazioMeusRoles";
import { IntroGaragem } from "./IntroGaragem";
import { ListaMeusEventos } from "./ListaMeusEventos";
import { ListaMeusLocais } from "./ListaMeusLocais";
import { ListaMeusRoles } from "./ListaMeusRoles";
import { PillsAvaliacaoGaragem } from "./PillsAvaliacaoGaragem";
import { PillsRecorteLocais } from "./PillsRecorteLocais";
import { SheetFiltrosMeusRoles } from "./SheetFiltrosMeusRoles";
import { TelemetriaGaragem } from "./TelemetriaGaragem";
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

type EstadoGaragem = {
  abaTipo: AbaTipoGaragem;
  aba: AbaMeusRoles;
  ritmo: RitmoRole | "todas";
  papel: PapelMeuRole | "todos";
  recorteLocais: RecorteLocaisGaragem;
  pillEventos: PillAvaliacaoGaragem;
  pillLocais: PillAvaliacaoGaragem;
};

const umDe = <T extends string>(valor: unknown, opcoes: readonly T[]): valor is T =>
  typeof valor === "string" && (opcoes as readonly string[]).includes(valor);

const lerEstadoGaragem = (valor: unknown): EstadoGaragem | null => {
  if (!valor || typeof valor !== "object") return null;
  const bruto = valor as Partial<EstadoGaragem>;
  if (!umDe(bruto.abaTipo, ["roles", "eventos", "locais"] as const)) return null;
  if (
    !umDe(bruto.aba, [
      "proximos",
      "confirmados",
      "aguardando",
      "concluidos",
      "recusados",
    ] as const)
  ) {
    return null;
  }
  if (!umDe(bruto.ritmo, ["tranquila", "moderada", "agressiva", "todas"] as const)) {
    return null;
  }
  if (!umDe(bruto.papel, ["participante", "organizador", "todos"] as const)) return null;
  if (!umDe(bruto.recorteLocais, ["favoritos", "visitados"] as const)) return null;
  if (
    !umDe(bruto.pillEventos, ["todos", "aguardando_avaliacao", "avaliados"] as const) ||
    !umDe(bruto.pillLocais, ["todos", "aguardando_avaliacao", "avaliados"] as const)
  ) {
    return null;
  }
  return {
    abaTipo: bruto.abaTipo,
    aba: bruto.aba,
    ritmo: bruto.ritmo,
    papel: bruto.papel,
    recorteLocais: bruto.recorteLocais,
    pillEventos: bruto.pillEventos,
    pillLocais: bruto.pillLocais,
  };
};

export const TelaMeusRoles = () => {
  const { payload, carregando, erro, recarregar } = useMeusRoles();
  const { abaTipo, setAbaTipo } = useAbaTipoGaragem();
  const filtros = useFiltrosMeusRoles(payload?.itens ?? []);
  const acao = useAcaoParticipacaoGaragem({ recarregar });
  const cancelarRole = useCancelarRole({ recarregar });

  const [recorteLocais, setRecorteLocais] =
    useState<RecorteLocaisGaragem>("favoritos");
  const eventos = useMeusEventosGaragem(abaTipo === "eventos");
  const locais = useMeusLocaisGaragem(abaTipo === "locais", recorteLocais);
  const filtroEventos = useFiltroAvaliacaoGaragem(eventos.itens, "eventos");
  const filtroLocais = useFiltroAvaliacaoGaragem(locais.itens, "locais");

  useEstadoRetorno(
    "garagem",
    {
      abaTipo,
      aba: filtros.filtros.aba,
      ritmo: filtros.filtros.ritmo,
      papel: filtros.filtros.papel,
      recorteLocais,
      pillEventos: filtroEventos.pill,
      pillLocais: filtroLocais.pill,
    },
    (salvo) => {
      const valido = lerEstadoGaragem(salvo);
      if (!valido) return;
      setAbaTipo(valido.abaTipo);
      filtros.restaurar({
        aba: valido.aba,
        ritmo: valido.ritmo,
        papel: valido.papel,
      });
      setRecorteLocais(valido.recorteLocais);
      filtroEventos.setPill(valido.pillEventos);
      filtroLocais.setPill(valido.pillLocais);
    },
  );

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
          tuneAtivo={filtros.tuneAtivo}
          sheetAberto={filtros.sheetAberto}
          onTune={() => filtros.setSheetAberto(true)}
        />
        <TelemetriaGaragem telemetria={payload?.telemetria ?? TELEMETRIA_ZERO} />

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
            <>
              <PillsRecorteLocais
                recorte={recorteLocais}
                onSelecionar={setRecorteLocais}
              />
              <PillsAvaliacaoGaragem
                pill={filtroLocais.pill}
                contagens={filtroLocais.contagensPill}
                onSelecionar={filtroLocais.setPill}
              />
            </>
          ) : null}
        </div>

        {abaTipo === "roles" ? (
          <>
            <AbasMeusRoles
              aba={filtros.filtros.aba}
              contagens={payload?.contagens ?? CONTAGENS_ZERO}
              onSelecionar={filtros.selecionarAba}
            />
            {filtros.tuneAtivo ? (
              <button
                type="button"
                className={styles.chipFiltrosAtivos}
                onClick={filtros.limparTune}
              >
                <span className="material-symbols-outlined" aria-hidden>
                  filter_alt_off
                </span>
                Filtros ativos · Limpar
              </button>
            ) : null}
            {erroAcao ? (
              <p className={styles.alertaAcao} role="alert">
                {erroAcao}
              </p>
            ) : null}
            {erro ? <EstadoErroMeusRoles onTentar={recarregar} /> : null}
            {carregando && !payload ? <EstadoCarregandoMeusRoles /> : null}
            {vazioRoles ? (
              <EstadoVazioMeusRoles
                aba={filtros.filtros.aba}
                tuneAtivo={filtros.tuneAtivo}
              />
            ) : null}
            {!erro && filtros.itensVisiveis.length > 0 ? (
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
            {eventos.carregando && filtroEventos.itensFiltrados.length === 0 ? (
              <EstadoCarregandoMeusRoles />
            ) : null}
            {vazioEventos ? (
              <EstadoVazioGaragem
                tipo="eventos"
                pill={filtroEventos.pill}
              />
            ) : null}
            {!eventos.erro && filtroEventos.itensFiltrados.length > 0 ? (
              <ListaMeusEventos itens={filtroEventos.itensFiltrados} />
            ) : null}
          </>
        ) : null}

        {abaTipo === "locais" ? (
          <>
            {locais.erro ? (
              <EstadoErroMeusRoles onTentar={locais.recarregar} />
            ) : null}
            {locais.carregando && filtroLocais.itensFiltrados.length === 0 ? (
              <EstadoCarregandoMeusRoles />
            ) : null}
            {vazioLocais ? (
              <EstadoVazioGaragem
                tipo="locais"
                pill={filtroLocais.pill}
                recorteLocais={recorteLocais}
              />
            ) : null}
            {!locais.erro && filtroLocais.itensFiltrados.length > 0 ? (
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
        mensagem={cancelarRole.toastMensagem}
        duracaoMs={cancelarRole.toastMs}
        onFechar={cancelarRole.fecharToast}
      />
    </div>
  );
};
