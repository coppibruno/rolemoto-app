import type { ComentarioPost } from "@/types/post-foto";
import { ItemComentario } from "./ItemComentario";
import styles from "../post-foto.module.css";

type Props = {
  total: number;
  itens: ComentarioPost[];
  carregando: boolean;
  erro: boolean;
  temAnteriores: boolean;
  carregandoMais: boolean;
  onAnteriores: () => void;
  onTentar: () => void;
  onApagar: (id: string) => void;
};

export const ListaComentarios = ({
  total,
  itens,
  carregando,
  erro,
  temAnteriores,
  carregandoMais,
  onAnteriores,
  onTentar,
  onApagar,
}: Props) => (
  <section className={styles.comentarios} aria-label="Comentários">
    <h2 className={styles.subtitulo}>Comentários{total > 0 ? ` · ${total}` : ""}</h2>
    {temAnteriores ? (
      <button type="button" className={styles.anteriores} onClick={onAnteriores} disabled={carregandoMais}>
        {carregandoMais ? "Carregando…" : "Comentários anteriores"}
      </button>
    ) : null}
    {carregando ? <p className={styles.vazio}>Carregando…</p> : null}
    {erro ? (
      <div className={styles.estado}>
        <p>Não foi possível carregar os comentários.</p>
        <button type="button" className={styles.secundario} onClick={onTentar}>
          Tentar de novo
        </button>
      </div>
    ) : null}
    {!carregando && !erro && itens.length === 0 ? (
      <p className={styles.vazio}>Nenhum comentário ainda</p>
    ) : null}
    <ul className={styles.lista}>
      {[...itens].reverse().map((item) => (
        <ItemComentario key={item.id} comentario={item} onApagar={onApagar} />
      ))}
    </ul>
  </section>
);
