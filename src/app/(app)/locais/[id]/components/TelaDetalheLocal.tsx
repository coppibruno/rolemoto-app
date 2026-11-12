"use client";

import { usePlayerDetalhe } from "@/app/(app)/stories/hooks/usePlayerDetalhe";
import { PlayerStories } from "@/app/(app)/components/PlayerStories";
import { BotaoApagarCatalogo } from "@/components/catalogo/BotaoApagarCatalogo";
import { useApagarCatalogo } from "@/components/catalogo/useApagarCatalogo";
import { useAuth } from "@/hooks/useAuth";
import { useDetalheLocal } from "../hooks/useDetalheLocal";
import { localDetalheService } from "../services/local-detalhe.service";
import { BlocoAvaliacaoLocal } from "./BlocoAvaliacaoLocal";
import { BlocoCheckinLocal } from "./BlocoCheckinLocal";
import { BlocoDonoBalcao } from "./BlocoDonoBalcao";
import { BlocoOfertasLocal } from "./BlocoOfertasLocal";
import { LinkBalcao } from "./LinkBalcao";
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
  const admin = useAuth().usuario?.admin === true;
  const exclusao = useApagarCatalogo(
    () => localDetalheService.excluir(id),
    "/locais",
    `Apagar “${local?.nome ?? "este local"}”? Some do catálogo, dos favoritos e das ofertas.`,
  );

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
        <HeroLocal local={local} onAbrirStories={() => player.abrir(null)} />
        <BlocoOfertasLocal localId={local.id} />
        {local.souDono || admin ? <LinkBalcao localId={local.id} /> : null}
        <BlocoCheckinLocal local={local} />
        <BlocoHorariosLocal local={local} />
        <BlocoFacilidadesLocal facilidades={local.facilidades} />
        <BlocoLocalizacaoLocal local={local} />
        <BlocoAvaliacaoLocal local={local} />
        {admin ? <BlocoDonoBalcao localId={local.id} donoInicial={local.dono ?? null} /> : null}
        <BotaoApagarCatalogo
          rotulo="Apagar local"
          ocupado={exclusao.ocupado}
          erro={exclusao.erro}
          onApagar={() => void exclusao.apagar()}
        />
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
