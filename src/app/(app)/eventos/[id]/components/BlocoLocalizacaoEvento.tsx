import { BotaoAbrirMaps } from "@/components/maps/BotaoAbrirMaps";
import { MapaEstatico } from "@/components/maps/MapaEstatico";
import type { Localizacao } from "@/types/role";
import { TITULO_LOCAL } from "../constants";
import styles from "../evento-detalhe.module.css";

type Props = {
  local: Localizacao;
};

export const BlocoLocalizacaoEvento = ({ local }: Props) => {
  const nome = local.nome.trim() || "Local do evento";

  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitulo}>
        <span className="material-symbols-outlined" aria-hidden>
          pin_drop
        </span>
        {TITULO_LOCAL}
      </h3>
      <div className={styles.enderecoBox}>
        <span className="material-symbols-outlined" aria-hidden>
          store
        </span>
        <div>
          <span className={styles.enderecoNome}>{nome}</span>
          <p className={styles.texto}>{local.endereco}</p>
        </div>
      </div>
      <div className={styles.mapa}>
        <MapaEstatico
          marcadores={[{ lat: local.lat, lng: local.lng, cor: "#ff6b00" }]}
          aria-label={`Mapa de ${nome}`}
        />
      </div>
      <BotaoAbrirMaps
        ponto={{
          lat: local.lat,
          lng: local.lng,
          endereco: local.endereco,
          nome,
        }}
      />
    </section>
  );
};
