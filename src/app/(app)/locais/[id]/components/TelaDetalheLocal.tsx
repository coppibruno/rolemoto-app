"use client";

import { usePlayerDetalhe } from "@/app/(app)/stories/hooks/usePlayerDetalhe";
import { PlayerStories } from "@/app/(app)/components/PlayerStories";
import { useDetalheLocal } from "../hooks/useDetalheLocal";
import { BlocoAvaliacaoLocal } from "./BlocoAvaliacaoLocal";
import { BlocoCheckinLocal } from "./BlocoCheckinLocal";
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
  const player = usePlayerDetalhe(Boolean(local));

  if (carregando) return <EstadoCarregandoLocal />;
  if (erro || !local) return <EstadoVazioLocal mensagem={erro} />;

  return (
    <div className={styles.tela}>
      <CabecalhoDetalheLocal
        convite={{
          id: local.id,
          nome: local.nome,
          endereco: local.endereco,
          categoria: local.categoria,
          aberto24h: local.aberto24h,
          horarios: local.horarios,
        }}
      />
      <main className={styles.conteudo}>
        <HeroLocal
          local={local}
          onAbrirStories={() => player.abrir(null)}
          onStoryCriada={(story) => player.abrir(story.id, story)}
        />
        <BlocoCheckinLocal local={local} />
        <BlocoHorariosLocal local={local} />
        <BlocoFacilidadesLocal facilidades={local.facilidades} />
        <BlocoLocalizacaoLocal local={local} />
        <BlocoAvaliacaoLocal local={local} />
      </main>
      <PlayerStories
        aberto={player.aberto}
        alvo={{ tipo: "local", id: local.id }}
        destaqueId={player.destaqueId}
        inicial={player.inicial}
        onFechar={player.fechar}
      />
    </div>
  );
};
