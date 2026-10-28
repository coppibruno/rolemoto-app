import { OPCOES_FACILIDADES } from "@/app/(app)/locais/constants";
import { ItemFicha } from "@/app/(publico)/r/[id]/components/ItemFicha";
import { formatarHorarioLocal } from "@/lib/horario-local";
import type { LocalPublico } from "@/types/local-publico";
import { COPY_FICHA, COPY_SEM_NOTA } from "../constants";
import styles from "../../../r/[id]/convite-role.module.css";

type Props = {
  local: LocalPublico;
};

export const FichaLocal = ({ local }: Props) => {
  const horario = formatarHorarioLocal(local);
  const nota =
    local.totalAvaliacoes > 0
      ? `★ ${local.notaMedia.toFixed(1)} · ${local.totalAvaliacoes} avaliações`
      : COPY_SEM_NOTA;
  const facilidades = local.facilidades
    .map((valor) => OPCOES_FACILIDADES.find((item) => item.valor === valor)?.label)
    .filter((label): label is string => Boolean(label))
    .join(" · ");

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
          icone="schedule"
          iconeClasse={styles.iconePartida}
          label="Horário"
          titulo={horario}
        />
        <ItemFicha
          icone="star"
          iconeClasse={styles.iconeRitmo}
          label="Avaliação"
          titulo={nota}
        />
        {facilidades ? (
          <ItemFicha
            icone="checklist"
            iconeClasse={styles.iconeDestino}
            label="No ponto"
            titulo={facilidades}
          />
        ) : null}
      </div>
    </section>
  );
};
