"use client";

import { LinhaTema } from "@/components/tema/BotaoTema";
import type { Usuario } from "@/types/user";
import { CartaoPiloto } from "../[uid]/components/CartaoPiloto";
import { AbasConteudoPerfil } from "./AbasConteudoPerfil";
import { LinkBloqueados } from "@/app/(app)/moderacao/components/LinkBloqueados";
import { BotaoCriarSenha } from "./BotaoCriarSenha";
import { BotaoExcluirConta } from "./BotaoExcluirConta";
import { BotaoInstalarApp } from "./BotaoInstalarApp";
import { BotaoSair } from "./BotaoSair";
import { CardCompletarPerfil } from "./CardCompletarPerfil";
import { FaixaMeusPontos } from "./FaixaMeusPontos";
import { GradeFotos } from "./GradeFotos";
import { HistoricoPistas } from "./HistoricoPistas";
import { LinhaAfiliados } from "./LinhaAfiliados";
import styles from "../perfil.module.css";

type Props = {
  usuario: Usuario;
  onEditar: () => void;
};

export const VisaoPerfil = ({ usuario, onEditar }: Props) => {
  const apelido = usuario.apelido.trim() || usuario.nome.trim().split(/\s+/)[0] || "";

  return (
    <div className={styles.visao}>
      <CartaoPiloto perfil={{ ...usuario, apelido, selos: usuario.selos ?? [] }} proprio />
      <button type="button" className={styles.botaoEditar} onClick={onEditar}>
        <span className="material-symbols-outlined" aria-hidden>
          edit
        </span>
        Editar perfil
      </button>
      <AbasConteudoPerfil
        fotos={<GradeFotos uid={usuario.uid} propria />}
        historico={<HistoricoPistas />}
      />
      <div className={styles.acoes}>
        <LinhaTema />
        <CardCompletarPerfil usuario={usuario} onCompletar={onEditar} />
        <FaixaMeusPontos locais={usuario.locaisComoDono ?? []} />
        {usuario.admin ? <LinhaAfiliados /> : null}
        <BotaoInstalarApp />
        <BotaoCriarSenha />
        <LinkBloqueados />
        <BotaoSair />
        <BotaoExcluirConta />
      </div>
    </div>
  );
};
