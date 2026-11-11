import Link from "next/link";
import type { MarcaPost } from "@/types/post-foto";
import styles from "../post-foto.module.css";

type Props = {
  marca: MarcaPost;
};

export const ChipMarcaPost = ({ marca }: Props) => (
  <Link
    href={marca.tipo === "local" ? `/locais/${marca.id}` : `/eventos/${marca.id}`}
    className={styles.chip}
  >
    <span className="material-symbols-outlined" aria-hidden>
      {marca.tipo === "local" ? "location_on" : "event"}
    </span>
    <span className={styles.chipNome}>@{marca.nome}</span>
  </Link>
);
