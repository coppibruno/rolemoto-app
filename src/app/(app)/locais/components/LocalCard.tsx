import type { Local } from "@/types/local";
import { BotaoAbrirMaps } from "@/components/maps/BotaoAbrirMaps";
import { OPCOES_CATEGORIA, OPCOES_FACILIDADES } from "../constants";
import { formatarHorarioLocal } from "@/lib/horario-local";
import styles from "../locais.module.css";

type Props = {
  local: Local;
};

const labelCategoria = (valor: Local["categoria"]) =>
  OPCOES_CATEGORIA.find((opcao) => opcao.valor === valor)?.label ?? valor;

const iconeCategoria = (valor: Local["categoria"]) =>
  OPCOES_CATEGORIA.find((opcao) => opcao.valor === valor)?.icone ?? "location_on";

const iconesFacilidades = (local: Local) =>
  local.facilidades
    .map((item) => OPCOES_FACILIDADES.find((opcao) => opcao.valor === item))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

export const LocalCard = ({ local }: Props) => {
  const facilidades = iconesFacilidades(local);
  const visiveis = facilidades.slice(0, 3);
  const extras = facilidades.length - visiveis.length;
  const hrefMaps = local.linkMaps.trim() || undefined;

  return (
    <article className={styles.card}>
      <div className={styles.cardFoto}>
        {local.fotoFachadaUrl ? (
          <img
            src={local.fotoFachadaUrl}
            alt={`Fachada de ${local.nome}`}
            className={styles.cardFotoImg}
          />
        ) : (
          <div className={styles.cardFotoPlaceholder} aria-hidden>
            <span className="material-symbols-outlined">
              {iconeCategoria(local.categoria)}
            </span>
          </div>
        )}
      </div>
      <div className={styles.cardCorpo}>
        <span className={styles.chipCategoria}>{labelCategoria(local.categoria)}</span>
        <h2 className={styles.cardNome}>{local.nome}</h2>
        <p className={styles.cardEndereco}>{local.endereco}</p>
        <p className={styles.cardHorario}>{formatarHorarioLocal(local)}</p>
        <div className={styles.cardRodape}>
          <div className={styles.facilidadesResumo}>
            {visiveis.map((item) => (
              <span
                key={item.valor}
                className={`material-symbols-outlined ${styles.facilidadeIcone}`}
                title={item.label}
                aria-label={item.label}
              >
                {item.icone}
              </span>
            ))}
            {extras > 0 ? (
              <span className={styles.facilidadeMais}>+{extras}</span>
            ) : null}
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
        </div>
      </div>
    </article>
  );
};
