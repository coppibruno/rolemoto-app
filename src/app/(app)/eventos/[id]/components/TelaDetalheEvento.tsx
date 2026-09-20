"use client";

import { useDetalheEvento } from "../hooks/useDetalheEvento";
import { BlocoAtracoesEvento } from "./BlocoAtracoesEvento";
import { BlocoAvaliacaoEvento } from "./BlocoAvaliacaoEvento";
import { BlocoDataEvento } from "./BlocoDataEvento";
import { BlocoInformacoesEvento } from "./BlocoInformacoesEvento";
import { BlocoIngressoEvento } from "./BlocoIngressoEvento";
import { BlocoLocalizacaoEvento } from "./BlocoLocalizacaoEvento";
import { BlocoPresencasEvento } from "./BlocoPresencasEvento";
import { CabecalhoDetalheEvento } from "./CabecalhoDetalheEvento";
import { EstadoCarregandoEvento, EstadoVazioEvento } from "./EstadoDetalheEvento";
import { HeroEvento } from "./HeroEvento";
import styles from "../evento-detalhe.module.css";

type Props = {
  id: string;
};

export const TelaDetalheEvento = ({ id }: Props) => {
  const { evento, carregando, erro } = useDetalheEvento(id);

  if (carregando) return <EstadoCarregandoEvento />;
  if (erro || !evento) return <EstadoVazioEvento mensagem={erro} />;

  return (
    <div className={styles.tela}>
      <CabecalhoDetalheEvento id={evento.id} titulo={evento.titulo} />
      <main className={styles.conteudo}>
        <HeroEvento evento={evento} />
        <BlocoDataEvento evento={evento} />
        <BlocoIngressoEvento evento={evento} />
        <BlocoAtracoesEvento atracoes={evento.atracoes} />
        <BlocoInformacoesEvento texto={evento.informacoes} />
        <BlocoLocalizacaoEvento local={evento.local} />
        <BlocoPresencasEvento evento={evento} />
        <BlocoAvaliacaoEvento evento={evento} />
      </main>
    </div>
  );
};
