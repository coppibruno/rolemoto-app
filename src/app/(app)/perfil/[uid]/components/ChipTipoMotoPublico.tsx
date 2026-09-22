import { OPCOES_TIPO_MOTO } from "@/components/perfil/constants-tipo-moto";
import type { TipoMoto } from "@/types/user";
import styles from "../perfil-publico.module.css";

type Props = {
  tipoMoto: TipoMoto | null;
};

export const ChipTipoMotoPublico = ({ tipoMoto }: Props) => {
  if (!tipoMoto) return null;

  return (
    <div
      className={styles.chipsTipoMoto}
      role="img"
      aria-label={`Tipo de moto: ${tipoMoto}`}
    >
      {OPCOES_TIPO_MOTO.map((opcao) => {
        const ativo = tipoMoto === opcao.valor;
        return (
          <div
            key={opcao.valor}
            className={`${styles.chipTipoMoto} ${ativo ? styles.chipTipoMotoAtivo : ""}`}
          >
            <span className="material-symbols-outlined" aria-hidden>
              {opcao.icone}
            </span>
            <span>{opcao.label}</span>
          </div>
        );
      })}
    </div>
  );
};
