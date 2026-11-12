import Image from "next/image";
import styles from "./logo-rolemoto.module.css";

type Props = {
  className?: string;
  width: number;
  height: number;
  priority?: boolean;
};

export const LogoRolemoto = ({ className, width, height, priority }: Props) => (
  <span
    className={[styles.caixa, className].filter(Boolean).join(" ")}
    role="img"
    aria-label="Rolê Moto"
  >
    <Image
      src="/logo-rolemoto.png"
      alt=""
      width={width}
      height={height}
      className={`${styles.imagem} ${styles.escura}`}
      priority={priority}
    />
    <Image
      src="/logo-rolemoto-claro.png"
      alt=""
      width={width}
      height={height}
      className={`${styles.imagem} ${styles.clara}`}
      priority={priority}
    />
  </span>
);
