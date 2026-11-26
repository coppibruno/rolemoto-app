export type Severidade = "bloqueio" | "bug" | "lacuna" | "aviso";

export type Achado = {
  severidade: Severidade;
  area: string;
  titulo: string;
  detalhe: string;
};

export class ColetorAchados {
  readonly itens: Achado[] = [];

  add(achado: Achado) {
    this.itens.push(achado);
  }

  async tentar(
    area: string,
    titulo: string,
    fn: () => Promise<void>,
    severidade: Severidade = "bug",
  ) {
    try {
      await fn();
    } catch (erro) {
      const detalhe = erro instanceof Error ? erro.message : String(erro);
      this.add({ severidade, area, titulo, detalhe: detalhe.slice(0, 500) });
    }
  }

  relatorio(): string {
    if (this.itens.length === 0) return "Nenhum problema encontrado nesta bateria.";
    const ordem: Severidade[] = ["bloqueio", "bug", "lacuna", "aviso"];
    const linhas = [...this.itens]
      .sort((a, b) => ordem.indexOf(a.severidade) - ordem.indexOf(b.severidade))
      .map(
        (a, i) =>
          `${i + 1}. [${a.severidade.toUpperCase()}] ${a.area} — ${a.titulo}\n   ${a.detalhe}`,
      );
    return linhas.join("\n\n");
  }
}
