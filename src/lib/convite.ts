import { formatarFaixaHero } from "@/app/(app)/feed/formatar-horario";

export type DadosConvite = {
  id: string;
  titulo: string;
  dataHoraSaida: string;
  localSaidaEndereco: string;
};

export const urlConvite = (id: string): string => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/r/${id}`;
};

export const textoConvite = (dados: DadosConvite): string => {
  const url = urlConvite(dados.id);
  return [
    `🏍️ ${dados.titulo}`,
    `📅 ${formatarFaixaHero(dados.dataHoraSaida)}`,
    `📍 ${dados.localSaidaEndereco}`,
    "",
    "Abre o convite:",
    url,
  ].join("\n");
};
