"use client";

import type { SugestaoEvento } from "@/types/sugestao-evento";
import { useCartaoSugestaoEvento } from "../hooks/useCartaoSugestaoEvento";
import { CamposSugestaoEvento } from "./CamposSugestaoEvento";
import { ChipsAcessoEvento } from "./ChipsAcessoEvento";
import { ChipsTipoEvento } from "./ChipsTipoEvento";
import styles from "../sugestoes-eventos.module.css";

type Props = {
  sugestao: SugestaoEvento;
  onDecidida: (id: string) => void;
};

export const CartaoSugestaoEvento = ({ sugestao, onDecidida }: Props) => {
  const estado = useCartaoSugestaoEvento(sugestao, onDecidida);
  const travado = estado.enviando !== null;
  const maps =
    `https://www.google.com/maps/search/?api=1&query=${sugestao.local.lat},${sugestao.local.lng}`;

  return (
    <article className={styles.cartao}>
      {sugestao.fotoCapaUrl ? (
        <div className={styles.fachada}>
          <img
            src={sugestao.fotoCapaUrl}
            alt={`Capa de ${sugestao.titulo}`}
            className={styles.fachadaImg}
          />
        </div>
      ) : (
        <p className={styles.aviso}>Sem foto. Recuse ou cadastre o evento na mão.</p>
      )}
      <CamposSugestaoEvento idPrefix={sugestao.id} estado={estado} />
      <p className={styles.semente}>
        {sugestao.local.nome || sugestao.cidade}
        {sugestao.local.endereco ? ` · ${sugestao.local.endereco}` : ""}
      </p>
      {sugestao.motivos.length > 0 ? (
        <ul className={styles.motivos}>
          {sugestao.motivos.map((motivo) => (
            <li key={motivo}>{motivo}</li>
          ))}
        </ul>
      ) : null}
      <ChipsTipoEvento valor={estado.tipo} onChange={estado.setTipo} desabilitado={travado} />
      <ChipsAcessoEvento valor={estado.acesso} onChange={estado.setAcesso} desabilitado={travado} />
      {estado.erroData ? <p className={styles.aviso}>{estado.erroData}</p> : null}
      <a className={styles.linkMaps} href={sugestao.urlOrigem} target="_blank" rel="noopener noreferrer">
        Abrir na agenda
      </a>
      <a className={styles.linkMaps} href={maps} target="_blank" rel="noopener noreferrer">
        Abrir no Maps
      </a>
      {estado.erro ? (
        <p className={styles.erro} role="alert">
          {estado.erro}
        </p>
      ) : null}
      <div className={styles.acoes}>
        {estado.enviando === "homologar" ? (
          <p className={styles.publicando}>Publicando…</p>
        ) : (
          <button
            type="button"
            className={styles.homologar}
            onClick={estado.homologar}
            disabled={!estado.podeHomologar || travado}
          >
            Homologar
          </button>
        )}
        <button type="button" className={styles.recusar} onClick={estado.recusar} disabled={travado}>
          Recusar
        </button>
      </div>
    </article>
  );
};
