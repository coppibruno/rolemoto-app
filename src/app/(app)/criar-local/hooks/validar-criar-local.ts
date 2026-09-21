import { ERRO_FORA_DO_SUL, pontoEstaNoSul } from "@/lib/regiao-sul";
import type { CategoriaLocal, ErrosCriarLocal, HorarioDiaForm } from "@/types/local";
import { HORA_RE, NOME_MAX, NOME_MIN } from "../constants";

const coordsValidas = (lat: number | null, lng: number | null): boolean =>
  typeof lat === "number" &&
  Number.isFinite(lat) &&
  typeof lng === "number" &&
  Number.isFinite(lng);

const horarioValido = (horarios: HorarioDiaForm[]): boolean => {
  const abertos = horarios.filter((dia) => !dia.fechado);
  if (abertos.length === 0) return false;
  return abertos.every(
    (dia) => HORA_RE.test(dia.abertura) && HORA_RE.test(dia.fechamento),
  );
};

export const validarCriarLocal = (campos: {
  nome: string;
  endereco: string;
  lat: number | null;
  lng: number | null;
  categoria: CategoriaLocal | null;
  aberto24h: boolean;
  horarios: HorarioDiaForm[];
  fotoErro?: string;
}): ErrosCriarLocal => {
  const erros: ErrosCriarLocal = {};
  const nome = campos.nome.trim();

  if (!nome) erros.nome = "Informe o nome do local";
  else if (nome.length < NOME_MIN) erros.nome = "Mínimo 3 caracteres";
  else if (nome.length > NOME_MAX) erros.nome = "Máximo 80 caracteres";

  if (campos.endereco.trim().length < NOME_MIN) {
    erros.endereco = "Informe o endereço";
  } else if (!coordsValidas(campos.lat, campos.lng)) {
    erros.endereco = "Escolha um endereço da lista, use o GPS ou o mapa";
  } else if (!pontoEstaNoSul(campos.lat as number, campos.lng as number)) {
    erros.endereco = ERRO_FORA_DO_SUL;
  }

  if (!campos.categoria) {
    erros.categoria = "Selecione a categoria do local";
  }

  if (!campos.aberto24h && !horarioValido(campos.horarios)) {
    erros.horario = "Informe o horário de pelo menos um dia aberto";
  }

  if (campos.fotoErro) {
    erros.foto = "Use JPG ou PNG de até 10 MB";
  }

  return erros;
};
