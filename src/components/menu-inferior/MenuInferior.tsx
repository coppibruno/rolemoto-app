"use client";

import { ItemMenu } from "./ItemMenu";
import { BotaoIncluir } from "./BotaoIncluir";
import { ITENS_MENU } from "./itens-menu";
import { useItemMenuAtivo } from "./hooks/useItemMenuAtivo";
import styles from "./menu-inferior.module.css";

export const MenuInferior = () => {
  const { estaAtivo } = useItemMenuAtivo();
  const [roles, aprovacoes, incluir, perfil] = ITENS_MENU;

  return (
    <nav className={styles.nav} aria-label="Navegação principal">
      <div className={styles.inner}>
        <div className={styles.grupo}>
          <ItemMenu item={roles} ativo={estaAtivo(roles.href)} />
          <ItemMenu item={aprovacoes} ativo={estaAtivo(aprovacoes.href)} />
        </div>
        <BotaoIncluir item={incluir} destacado={estaAtivo(incluir.href)} />
        <div className={styles.grupo}>
          <ItemMenu item={perfil} ativo={estaAtivo(perfil.href)} />
        </div>
      </div>
    </nav>
  );
};
