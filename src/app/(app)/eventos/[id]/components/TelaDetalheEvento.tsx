"use client";

import { usePlayerDetalhe } from "@/app/(app)/stories/hooks/usePlayerDetalhe";
import { PlayerStories } from "@/app/(app)/components/PlayerStories";
import { BotaoApagarCatalogo } from "@/components/catalogo/BotaoApagarCatalogo";
import { useApagarCatalogo } from "@/components/catalogo/useApagarCatalogo";
import { useDetalheEvento } from "../hooks/useDetalheEvento";
import { eventoDetalheService } from "../services/evento-detalhe.service";
import { BlocoAtracoesEvento } from "./BlocoAtracoesEvento";
import { BlocoAdminSerie } from "./BlocoAdminSerie";
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
  const { evento, carregando, erro, recarregar } = useDetalheEvento(id);
  const player = usePlayerDetalhe(Boolean(evento));
  const exclusao = useApagarCatalogo(
    () => eventoDetalheService.excluir(id),
    "/",
    `Apagar “${evento?.titulo ?? "este evento"}”? Some do feed, com inscrições e convites.`,
  );

  if (carregando) return <EstadoCarregandoEvento />;
  if (erro || !evento) return <EstadoVazioEvento mensagem={erro} />;

  const alvoAlbum = evento.localId
    ? { tipo: "local" as const, id: evento.localId }
    : { tipo: "evento" as const, id: evento.id };

  return (
    <div className={styles.tela}>
      <CabecalhoDetalheEvento
        convite={{
          id: evento.id,
          titulo: evento.titulo,
          dataHoraAbertura: evento.dataHoraAbertura,
          dataHoraEncerramento: evento.dataHoraEncerramento,
          localNome: evento.local.nome,
          localEndereco: evento.local.endereco,
        }}
      />
      <main className={styles.conteudo}>
        <HeroEvento
          evento={evento}
          onAbrirStories={() => player.abrir(null)}
          onStoryCriada={(story) => player.abrir(story.id, story)}
        />
        <BlocoDataEvento evento={evento} />
        <BlocoIngressoEvento evento={evento} />
        <BlocoAtracoesEvento atracoes={evento.atracoes} />
        <BlocoInformacoesEvento texto={evento.informacoes} />
        <BlocoLocalizacaoEvento local={evento.local} />
        <BlocoPresencasEvento evento={evento} />
        <BlocoAvaliacaoEvento evento={evento} />
        <BlocoAdminSerie evento={evento} onSalvo={recarregar} />
        <BotaoApagarCatalogo
          rotulo="Apagar evento"
          ocupado={exclusao.ocupado}
          erro={exclusao.erro}
          onApagar={() => void exclusao.apagar()}
        />
      </main>
      <PlayerStories
        aberto={player.aberto}
        alvo={alvoAlbum}
        destaqueId={player.destaqueId}
        inicial={player.inicial}
        onFechar={player.fechar}
      />
    </div>
  );
};
