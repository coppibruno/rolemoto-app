import type { RolePublico } from "@/types/role-publico";
import { BannerInstalarApp } from "@/components/pwa/BannerInstalarApp";
import { CabecalhoConviteRole } from "./CabecalhoConviteRole";
import { CardOrganizador } from "./CardOrganizador";
import { FichaTecnicaComboio } from "./FichaTecnicaComboio";
import { GradePilotos } from "./GradePilotos";
import { HeroCapaRole } from "./HeroCapaRole";
import { RodapeConversao } from "./RodapeConversao";
import { TituloConvite } from "./TituloConvite";
import styles from "../convite-role.module.css";

type Props = {
  role: RolePublico;
};

export const TelaConviteRole = ({ role }: Props) => {
  const encerrado = Date.parse(role.dataHoraSaida) < Date.now();

  return (
    <div className={styles.tela}>
      <CabecalhoConviteRole role={role} />
      <BannerInstalarApp variante="fluxo" />
      <HeroCapaRole
        titulo={role.titulo}
        fotoCapaUrl={role.fotoCapaUrl}
        ritmo={role.ritmo}
        distanciaKm={role.distanciaKm}
        dataHoraSaida={role.dataHoraSaida}
      />
      <div className={styles.corpo}>
        <TituloConvite
          titulo={role.titulo}
          descricao={role.descricao}
          encerrado={encerrado}
        />
        <CardOrganizador criador={role.criador} />
        <FichaTecnicaComboio
          localSaidaEndereco={role.localSaidaEndereco}
          destinoFinalEndereco={role.destinoFinalEndereco}
          localSaidaNome={role.localSaidaNome}
          destinoFinalNome={role.destinoFinalNome}
          localSaidaLat={role.localSaidaLat}
          localSaidaLng={role.localSaidaLng}
          destinoFinalLat={role.destinoFinalLat}
          destinoFinalLng={role.destinoFinalLng}
          dataHoraSaida={role.dataHoraSaida}
          ritmo={role.ritmo}
        />
        <GradePilotos
          confirmados={role.participantes.confirmados}
          destaques={role.participantes.destaques}
        />
      </div>
      <RodapeConversao role={role} />
    </div>
  );
};
