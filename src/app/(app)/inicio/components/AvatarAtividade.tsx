import Link from "next/link";
import styles from "../inicio.module.css";

type Props = {
  uid: string;
  apelido: string;
  fotoUrl: string;
  href: string;
  tamanho?: 32 | 40;
};

export const AvatarAtividade = ({ apelido, fotoUrl, href, tamanho = 40 }: Props) => {
  const classe = tamanho === 32 ? styles.avatar32 : styles.avatar40;
  return (
    <Link href={href} aria-label={apelido} onClick={(e) => e.stopPropagation()}>
      {fotoUrl ? (
        <img src={fotoUrl} alt="" className={classe} referrerPolicy="no-referrer" />
      ) : (
        <span className={classe} aria-hidden>
          <span className="material-symbols-outlined">person</span>
        </span>
      )}
    </Link>
  );
};
