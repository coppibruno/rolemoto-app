"use client";

import { Component, type ReactNode } from "react";

type Props = {
  aoFalhar: () => void;
  children: ReactNode;
};

type Estado = { falhou: boolean };

/** Erro de render ou de chunk do mapa salvo fica aqui; o resto da tela segue de pé. */
export class LimiteFalhaMapa extends Component<Props, Estado> {
  state: Estado = { falhou: false };

  static getDerivedStateFromError(): Estado {
    return { falhou: true };
  }

  componentDidCatch(erro: unknown): void {
    console.error(erro);
    this.props.aoFalhar();
  }

  render(): ReactNode {
    return this.state.falhou ? null : this.props.children;
  }
}
