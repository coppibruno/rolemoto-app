import type { EventoPublico } from "@/types/evento-publico";
import { BannerInstalarApp } from "@/components/pwa/BannerInstalarApp";
import { CardOrganizador } from "@/app/(publico)/r/[id]/components/CardOrganizador";
import { GradePilotos } from "@/app/(publico)/r/[id]/components/GradePilotos";
import {
  COPY_GRADE_COUNT,
  COPY_GRADE_LABEL,
  COPY_PRIMEIRO_PILOTO,
} from "../constants";
import { CabecalhoConviteEvento } from "./CabecalhoConviteEvento";
import { FichaEvento } from "./FichaEvento";
import { HeroCapaEvento } from "./HeroCapaEvento";
import { RodapeConversaoEvento } from "./RodapeConversaoEvento";
import { TituloConviteEvento } from "./TituloConviteEvento";
import styles from "../../../r/[id]/convite-role.module.css";

type Props = {
  evento: EventoPublico;
};

const eventoEncerrou = (evento: EventoPublico): boolean => {
  const limite = evento.dataHoraEncerramento ?? evento.dataHoraAbertura;
  return Date.parse(limite) <= Date.now();
};

export const TelaConviteEvento = ({ evento }: Props) => {
  const encerrado = eventoEncerrou(evento);

  return (
    <div className={styles.tela}>
      <CabecalhoConviteEvento evento={evento} />
      <BannerInstalarApp variante="fluxo" />
      <HeroCapaEvento evento={evento} />
      <div className={styles.corpo}>
        <TituloConviteEvento
          titulo={evento.titulo}
          informacoes={evento.informacoes}
          encerrado={encerrado}
        />
        <CardOrganizador criador={evento.criador} />
        <FichaEvento evento={evento} />
        <GradePilotos
          confirmados={evento.participantes.confirmados}
          destaques={evento.participantes.destaques}
          label={COPY_GRADE_LABEL}
          countLabel={COPY_GRADE_COUNT}
          vazio={COPY_PRIMEIRO_PILOTO}
        />
      </div>
      <RodapeConversaoEvento evento={evento} />
    </div>
  );
};
