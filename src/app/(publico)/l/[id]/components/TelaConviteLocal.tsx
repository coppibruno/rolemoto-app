import { BannerInstalarApp } from "@/components/pwa/BannerInstalarApp";
import type { LocalPublico } from "@/types/local-publico";
import { CabecalhoConviteLocal } from "./CabecalhoConviteLocal";
import { FichaLocal } from "./FichaLocal";
import { HeroCapaLocal } from "./HeroCapaLocal";
import { RodapeConversaoLocal } from "./RodapeConversaoLocal";
import { TituloConviteLocal } from "./TituloConviteLocal";
import styles from "../../../r/[id]/convite-role.module.css";

type Props = {
  local: LocalPublico;
};

export const TelaConviteLocal = ({ local }: Props) => {
  return (
    <div className={styles.tela}>
      <CabecalhoConviteLocal
        convite={{
          id: local.id,
          nome: local.nome,
          endereco: local.endereco,
          categoria: local.categoria,
          aberto24h: local.aberto24h,
          horarios: local.horarios,
        }}
      />
      <BannerInstalarApp variante="fluxo" />
      <HeroCapaLocal local={local} />
      <div className={styles.corpo}>
        <TituloConviteLocal nome={local.nome} endereco={local.endereco} />
        <FichaLocal local={local} />
      </div>
      <RodapeConversaoLocal id={local.id} />
    </div>
  );
};
