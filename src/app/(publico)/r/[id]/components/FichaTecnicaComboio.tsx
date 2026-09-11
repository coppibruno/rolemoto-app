import type { RitmoRole } from "@/types/role";
import { formatarHora } from "@/app/(app)/feed/formatar-horario";
import { COPY_BRIEFING, COPY_FICHA, LABELS_RITMO_FICHA } from "../constants";
import { ItemFicha } from "./ItemFicha";
import styles from "../convite-role.module.css";

type Props = {
  localSaidaEndereco: string;
  destinoFinalEndereco: string;
  dataHoraSaida: string;
  ritmo: RitmoRole;
};

export const FichaTecnicaComboio = ({
  localSaidaEndereco,
  destinoFinalEndereco,
  dataHoraSaida,
  ritmo,
}: Props) => {
  const hora = formatarHora(dataHoraSaida);

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
          titulo={localSaidaEndereco}
          detalhe={
            <p className={styles.itemDetalhe}>
              <span className={styles.ponto} aria-hidden />
              Saída pontual às {hora}h
            </p>
          }
        />
        <ItemFicha
          icone="flag"
          iconeClasse={styles.iconeDestino}
          label="Destino"
          titulo={destinoFinalEndereco}
        />
        <ItemFicha
          icone="warning"
          iconeClasse={styles.iconeRitmo}
          label="Nível & Requisitos"
          titulo={LABELS_RITMO_FICHA[ritmo]}
        />
      </div>
    </section>
  );
};
