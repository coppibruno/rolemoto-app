import { BotaoAbrirMaps } from "@/components/maps/BotaoAbrirMaps";
import { MapaEstatico } from "@/components/maps/MapaEstatico";
import type { LocalDetalhe } from "@/types/local";
import { TITULO_LOCAL } from "../constants";
import styles from "../local-detalhe.module.css";

type Props = {
  local: LocalDetalhe;
};

export const BlocoLocalizacaoLocal = ({ local }: Props) => {
  const hrefMaps = local.linkMaps.trim() || undefined;

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
          location_on
        </span>
        <p className={styles.texto}>{local.endereco}</p>
      </div>
      <div className={styles.mapa}>
        <MapaEstatico
          marcadores={[{ lat: local.lat, lng: local.lng, cor: "#ff6b00" }]}
          aria-label={`Mapa de ${local.nome}`}
        />
      </div>
      <BotaoAbrirMaps
        ponto={{
          lat: local.lat,
          lng: local.lng,
          endereco: local.endereco,
          nome: local.nome,
        }}
        href={hrefMaps}
      />
    </section>
  );
};
