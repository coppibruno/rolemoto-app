"use client";

import type { Usuario } from "@/types/user";
import styles from "../perfil.module.css";

type Props = {
  usuario: Usuario;
  onCompletar: () => void;
};

const camposFaltando = (usuario: Usuario): string[] => {
  const faltando: string[] = [];
  if (!usuario.fotoUrl.trim()) faltando.push("foto");
  if (!usuario.apelido.trim()) faltando.push("apelido");
  if (!usuario.tipoMoto) faltando.push("tipo da moto");
  if (!usuario.cidade.trim()) faltando.push("cidade");
  return faltando;
};

const listar = (itens: string[]): string =>
  itens.length <= 1 ? itens.join("") : `${itens.slice(0, -1).join(", ")} e ${itens.at(-1)}`;

export const CardCompletarPerfil = ({ usuario, onCompletar }: Props) => {
  const faltando = camposFaltando(usuario);
  if (faltando.length === 0) return null;

  return (
    <button type="button" className={styles.cardCompletar} onClick={onCompletar}>
      <span className="material-symbols-outlined" aria-hidden>
        person_edit
      </span>
      <span className={styles.cardCompletarTexto}>
        <strong>Complete seu perfil</strong>
        <span>Falta {listar(faltando)}. Ajuda o líder a te conhecer.</span>
      </span>
      <span className="material-symbols-outlined" aria-hidden>
        chevron_right
      </span>
    </button>
  );
};
