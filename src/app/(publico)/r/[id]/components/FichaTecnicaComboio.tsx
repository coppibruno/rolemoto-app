import type { AcessoRole, Localizacao, RitmoRole } from "@/types/role";
import { BotaoAbrirMaps } from "@/components/maps/BotaoAbrirMaps";
import { BlocoParadasRole } from "@/components/roles/BlocoParadasRole";
import { rotuloParadas } from "@/lib/mapa-viagem/viagem";
import { subtituloLocal, tituloLocal } from "@/lib/localizacao";
import { formatarHora } from "@/app/(app)/feed/formatar-horario";
import {
  COPY_BRIEFING,
  COPY_FICHA,
  LABELS_ACESSO_FICHA,
  LABELS_RITMO_FICHA,
} from "../constants";
import { ItemFicha } from "./ItemFicha";
import styles from "../convite-role.module.css";

type Props = {
  localSaidaEndereco: string;
  destinoFinalEndereco: string;
  localSaidaNome: string;
  destinoFinalNome: string;
  localSaidaLat: number;
  localSaidaLng: number;
  destinoFinalLat: number;
  destinoFinalLng: number;
  paradas: Localizacao[];
  dataHoraSaida: string;
  ritmo: RitmoRole;
  acesso?: AcessoRole;
};

export const FichaTecnicaComboio = ({
  localSaidaEndereco,
  destinoFinalEndereco,
  localSaidaNome,
  destinoFinalNome,
  localSaidaLat,
  localSaidaLng,
  destinoFinalLat,
  destinoFinalLng,
  paradas,
  dataHoraSaida,
  ritmo,
  acesso,
}: Props) => {
  const hora = formatarHora(dataHoraSaida);
  const partida = { nome: localSaidaNome, endereco: localSaidaEndereco };
  const destino = { nome: destinoFinalNome, endereco: destinoFinalEndereco };

  return (
    <section>
      <div className={styles.fichaCabecalho}>
        <h2 className={styles.fichaTitulo}>
          <span className={styles.fichaBarra} aria-hidden />
          {COPY_FICHA}
        </h2>
        <span className={styles.fichaHint}>{COPY_BRIEFING}</span>
      </div>
      <div className={styles.ficha}>
        <ItemFicha
          icone="location_on"
          iconeClasse={styles.iconePartida}
          label="Ponto de Encontro"
          titulo={tituloLocal(partida)}
          detalhe={
            <p className={styles.itemDetalhe}>
              <span className={styles.ponto} aria-hidden />
              Saída pontual às {hora}h
            </p>
          }
          acao={
            <BotaoAbrirMaps
              ponto={{
                lat: localSaidaLat,
                lng: localSaidaLng,
                endereco: localSaidaEndereco,
                nome: localSaidaNome,
              }}
            />
          }
        />
        {paradas.length > 0 ? (
          <ItemFicha
            icone="more_vert"
            iconeClasse={styles.iconePartida}
            label="Paradas"
            titulo={rotuloParadas(paradas.length)}
            detalhe={<BlocoParadasRole paradas={paradas} comRotulo={false} />}
          />
        ) : null}
        <ItemFicha
          icone="flag"
          iconeClasse={styles.iconeDestino}
          label="Destino"
          titulo={tituloLocal(destino)}
          subtitulo={subtituloLocal(destino) ?? undefined}
          acao={
            <BotaoAbrirMaps
              ponto={{
                lat: destinoFinalLat,
                lng: destinoFinalLng,
                endereco: destinoFinalEndereco,
                nome: destinoFinalNome,
              }}
            />
          }
        />
        <ItemFicha
          icone="warning"
          iconeClasse={styles.iconeRitmo}
          label="Nível & Requisitos"
          titulo={LABELS_RITMO_FICHA[ritmo]}
        />
        {acesso ? (
          <ItemFicha
            icone={acesso === "aberto" ? "lock_open" : "lock"}
            iconeClasse={styles.iconeRitmo}
            label="Quem entra"
            titulo={LABELS_ACESSO_FICHA[acesso]}
          />
        ) : null}
      </div>
    </section>
  );
};
