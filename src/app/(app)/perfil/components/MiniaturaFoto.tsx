import Link from "next/link";
import { hrefPost, type ItemGradePost } from "@/types/post-foto";
import { formatarDataMeta } from "../formatar-data-historico";
import styles from "../fotos-perfil.module.css";

type Props = {
  autorUid: string;
  item: ItemGradePost;
};

export const MiniaturaFoto = ({ autorUid, item }: Props) => (
  <li>
    <Link
      href={hrefPost(autorUid, item.id)}
      className={styles.miniatura}
      aria-label={`Foto de ${formatarDataMeta(item.createdAt)}`}
    >
      <img src={item.fotoUrl} alt="" loading="lazy" decoding="async" />
    </Link>
  </li>
);
