import { formatarPeriodoEvento } from "@/app/(app)/feed/formatar-horario";
import { tituloLocal } from "@/lib/localizacao";
import type { EventoPublico } from "@/types/evento-publico";
import { ItemFicha } from "@/app/(publico)/r/[id]/components/ItemFicha";
import { COPY_FICHA, LABELS_ACESSO_EVENTO } from "../constants";
import styles from "../../../r/[id]/convite-role.module.css";

type Props = {
  evento: Pick<
    EventoPublico,
    | "localNome"
    | "localEndereco"
    | "dataHoraAbertura"
    | "dataHoraEncerramento"
    | "acesso"
  >;
};

export const FichaEvento = ({ evento }: Props) => {
  const local = tituloLocal({
    nome: evento.localNome,
    endereco: evento.localEndereco,
  });

  return (
    <section>
      <div className={styles.fichaCabecalho}>
        <h2 className={styles.fichaTitulo}>
          <span className={styles.fichaBarra} aria-hidden />
          {COPY_FICHA}
        </h2>
      </div>
      <div className={styles.ficha}>
        <ItemFicha
          icone="calendar_month"
          iconeClasse={styles.iconePartida}
          label="Quando"
          titulo={formatarPeriodoEvento(
            evento.dataHoraAbertura,
            evento.dataHoraEncerramento,
          )}
        />
        <ItemFicha
          icone="location_on"
          iconeClasse={styles.iconeDestino}
          label="Local"
          titulo={local}
          subtitulo={
            evento.localEndereco !== local ? evento.localEndereco : undefined
          }
        />
        <ItemFicha
          icone="confirmation_number"
          iconeClasse={styles.iconeRitmo}
          label="Acesso"
          titulo={LABELS_ACESSO_EVENTO[evento.acesso]}
        />
      </div>
    </section>
  );
};
