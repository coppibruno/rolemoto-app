"use client";

import { useDetalheLocal } from "../hooks/useDetalheLocal";
import { BlocoAvaliacaoLocal } from "./BlocoAvaliacaoLocal";
import { BlocoFacilidadesLocal } from "./BlocoFacilidadesLocal";
import { BlocoHorariosLocal } from "./BlocoHorariosLocal";
import { BlocoLocalizacaoLocal } from "./BlocoLocalizacaoLocal";
import { CabecalhoDetalheLocal } from "./CabecalhoDetalheLocal";
import { EstadoCarregandoLocal, EstadoVazioLocal } from "./EstadoDetalheLocal";
import { HeroLocal } from "./HeroLocal";
import styles from "../local-detalhe.module.css";

type Props = {
  id: string;
};

export const TelaDetalheLocal = ({ id }: Props) => {
  const { local, carregando, erro } = useDetalheLocal(id);

  if (carregando) return <EstadoCarregandoLocal />;
  if (erro || !local) return <EstadoVazioLocal mensagem={erro} />;

  return (
    <div className={styles.tela}>
      <CabecalhoDetalheLocal id={local.id} nome={local.nome} />
      <main className={styles.conteudo}>
        <HeroLocal local={local} />
        <BlocoHorariosLocal local={local} />
        <BlocoFacilidadesLocal facilidades={local.facilidades} />
        <BlocoLocalizacaoLocal local={local} />
        <BlocoAvaliacaoLocal local={local} />
      </main>
    </div>
  );
};
