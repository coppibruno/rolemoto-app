"use client";

import { useAuth } from "@/hooks/useAuth";
import { ItemMenu } from "./ItemMenu";
import { BotaoIncluir } from "./BotaoIncluir";
import { ITENS_MENU } from "./itens-menu";
import { useItemMenuAtivo } from "./hooks/useItemMenuAtivo";
import styles from "./menu-inferior.module.css";

export const MenuInferior = () => {
  const { estaAtivo } = useItemMenuAtivo();
  const { usuario } = useAuth();
  const [inicio, explorar, incluir, meusRoles, perfil] = ITENS_MENU;

  return (
    <nav className={styles.nav} aria-label="Navegação principal">
      <div className={styles.inner}>
        <div className={styles.grupo}>
          <ItemMenu item={inicio} ativo={estaAtivo(inicio.href)} />
          <ItemMenu item={explorar} ativo={estaAtivo(explorar.href)} />
        </div>
        <BotaoIncluir
          item={incluir}
          destacado={estaAtivo(incluir.href)}
          admin={usuario?.admin === true}
        />
        <div className={styles.grupo}>
          <ItemMenu item={meusRoles} ativo={estaAtivo(meusRoles.href)} />
          <ItemMenu item={perfil} ativo={estaAtivo(perfil.href)} />
        </div>
      </div>
    </nav>
  );
};
