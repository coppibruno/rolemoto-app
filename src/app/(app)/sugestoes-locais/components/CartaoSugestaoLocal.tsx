"use client";

import { CreditoFoto } from "@/components/CreditoFoto";
import { formatarHorarioLocal } from "@/lib/horario-local";
import type { SugestaoLocal } from "@/types/sugestao-local";
import { SeletorHorarioLocal } from "../../criar-local/components/SeletorHorarioLocal";
import { useCartaoSugestao } from "../hooks/useCartaoSugestao";
import { CamposTextoSugestao } from "./CamposTextoSugestao";
import { ChipsCategoriaSugestao } from "./ChipsCategoriaSugestao";
import styles from "../sugestoes-locais.module.css";

type Props = {
  sugestao: SugestaoLocal;
  onDecidida: (id: string) => void;
};

const formatarDistancia = (km: number): string =>
  km.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const CartaoSugestaoLocal = ({ sugestao, onDecidida }: Props) => {
  const estado = useCartaoSugestao(sugestao, onDecidida);
  const motivos = sugestao.motivos.filter((motivo) => !motivo.includes(sugestao.sementeNome));
  const maps =
    sugestao.linkMaps ||
    `https://www.google.com/maps/search/?api=1&query=${sugestao.lat},${sugestao.lng}`;

  return (
    <article className={styles.cartao}>
      {sugestao.fotoFachadaUrl ? (
        <div className={styles.fachada}>
          <img
            src={sugestao.fotoFachadaUrl}
            alt={`Fachada de ${estado.nome}`}
            className={styles.fachadaImg}
          />
          <CreditoFoto texto={sugestao.fotoAtribuicao} />
        </div>
      ) : null}
      <CamposTextoSugestao
        idPrefix={sugestao.id}
        nome={estado.nome}
        endereco={estado.endereco}
        onNome={estado.setNome}
        onEndereco={estado.setEndereco}
        erroNome={estado.erroNome}
        erroEndereco={estado.erroEndereco}
        desabilitado={estado.enviando !== null}
      />
      <p className={styles.semente}>
        {formatarDistancia(sugestao.distanciaSementeKm)} km · {sugestao.sementeNome}
      </p>
      {motivos.length > 0 ? (
        <ul className={styles.motivos}>
          {motivos.map((motivo) => (
            <li key={motivo}>{motivo}</li>
          ))}
        </ul>
      ) : null}
      <ChipsCategoriaSugestao
        valor={estado.categoria}
        onChange={estado.setCategoria}
        desabilitado={estado.enviando !== null}
      />
      {sugestao.horarioCompleto ? (
        <p className={styles.horario}>{formatarHorarioLocal(sugestao)}</p>
      ) : (
        <SeletorHorarioLocal
          aberto24h={estado.aberto24h}
          horarios={estado.horarios}
          onMudarModo={estado.mudarModo}
          onMudarDia={estado.mudarDia}
          desabilitado={estado.enviando !== null}
        />
      )}
      <a className={styles.linkMaps} href={maps} target="_blank" rel="noopener noreferrer">
        Abrir no Maps
      </a>
      {!estado.podeHomologar ? (
        <p className={styles.aviso}>Defina o horário para homologar.</p>
      ) : null}
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
            disabled={!estado.podeHomologar || estado.enviando !== null}
          >
            Homologar
          </button>
        )}
        <button
          type="button"
          className={styles.recusar}
          onClick={estado.recusar}
          disabled={estado.enviando !== null}
        >
          Recusar
        </button>
      </div>
    </article>
  );
};
