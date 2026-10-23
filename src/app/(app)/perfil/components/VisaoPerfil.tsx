"use client";

import type { Usuario } from "@/types/user";
import { CartaoPiloto } from "../[uid]/components/CartaoPiloto";
import { BotaoCriarSenha } from "./BotaoCriarSenha";
import { BotaoExcluirConta } from "./BotaoExcluirConta";
import { BotaoInstalarApp } from "./BotaoInstalarApp";
import { BotaoSair } from "./BotaoSair";
import { CardCompletarPerfil } from "./CardCompletarPerfil";
import { HistoricoPistas } from "./HistoricoPistas";
import styles from "../perfil.module.css";

type Props = {
  usuario: Usuario;
  onEditar: () => void;
};

export const VisaoPerfil = ({ usuario, onEditar }: Props) => {
  const apelido = usuario.apelido.trim() || usuario.nome.trim().split(/\s+/)[0] || "";

  return (
    <div className={styles.visao}>
      <CartaoPiloto perfil={{ ...usuario, apelido, selos: usuario.selos ?? [] }} />
      <CardCompletarPerfil usuario={usuario} onCompletar={onEditar} />
      <button type="button" className={styles.botaoEditar} onClick={onEditar}>
        <span className="material-symbols-outlined" aria-hidden>
          edit
        </span>
        Editar perfil
      </button>
      <HistoricoPistas />
      <div className={styles.acoes}>
        <BotaoInstalarApp />
        <BotaoCriarSenha />
        <BotaoSair />
        <BotaoExcluirConta />
      </div>
    </div>
  );
};
