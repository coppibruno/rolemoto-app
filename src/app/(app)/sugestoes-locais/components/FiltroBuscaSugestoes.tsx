import { FACETAS_BUSCA, ROTULO_FACETA, type FacetaBusca } from "@/types/sugestao-local";
import styles from "../sugestoes-locais.module.css";

type Props = {
  facetas: FacetaBusca[];
  desabilitado: boolean;
  onAlternar: (faceta: FacetaBusca) => void;
};

export const FiltroBuscaSugestoes = ({ facetas, desabilitado, onAlternar }: Props) => {
  return (
    <fieldset className={styles.filtros} disabled={desabilitado}>
      <legend className={styles.filtrosLegenda}>Filtrar por</legend>
      <div className={styles.filtroLista}>
        {FACETAS_BUSCA.map((faceta) => (
          <label key={faceta} className={styles.filtroOpcao}>
            <input
              type="checkbox"
              checked={facetas.includes(faceta)}
              onChange={() => onAlternar(faceta)}
            />
            {ROTULO_FACETA[faceta]}
          </label>
        ))}
      </div>
    </fieldset>
  );
};
