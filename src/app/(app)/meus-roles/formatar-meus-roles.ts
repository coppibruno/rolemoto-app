import { formatarHora } from "@/app/(app)/feed/formatar-horario";
import type { DadosConvite } from "@/lib/convite";
import { tituloLocal } from "@/lib/localizacao";
import type { MeuRoleItem } from "@/types/meus-roles";

const TZ = "America/Sao_Paulo";

const ymdSaoPaulo = (data: Date): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(data);

const somarDiasYmd = (ymd: string, dias: number): string => {
  const [ano, mes, dia] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(ano, mes - 1, dia + dias));
  return dt.toISOString().slice(0, 10);
};

const formatarDiaMes = (iso: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
  }).format(new Date(iso));

export const formatarPedidoRelativo = (iso: string): string => {
  const data = new Date(iso);
  const hora = formatarHora(iso);
  const ymd = ymdSaoPaulo(data);
  const hoje = ymdSaoPaulo(new Date());
  if (ymd === hoje) return `Enviada hoje • ${hora}`;
  if (ymd === somarDiasYmd(hoje, -1)) return `Enviada ontem • ${hora}`;
  return `Enviada em ${formatarDiaMes(iso)} • ${hora}`;
};

export const formatarDataConcluido = (iso: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));

export const formatarDataEventoCapa = (iso: string): string => {
  const data = new Date(iso);
  const dia = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
  }).format(data);
  const mes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    month: "short",
  })
    .format(data)
    .replace(".", "")
    .toUpperCase();
  const weekday = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    weekday: "long",
  })
    .format(data)
    .toUpperCase();
  return `${dia} ${mes} · ${weekday}`;
};

export const formatarAvaliadoRelativo = (iso: string): string => {
  const ms = Date.now() - Date.parse(iso);
  const dias = Math.max(0, Math.floor(ms / 86_400_000));
  if (dias === 0) return "Avaliado hoje";
  if (dias === 1) return "Avaliado há 1 dia";
  if (dias < 30) return `Avaliado há ${dias} dias`;
  return `Avaliado em ${formatarDataConcluido(iso)}`;
};

export const formatarKm = (km: number | null | undefined): string => {
  const valor = typeof km === "number" && Number.isFinite(km) ? km : 0;
  return `${valor.toLocaleString("pt-BR")} km`;
};

export const dadosConviteDe = (item: MeuRoleItem): DadosConvite => ({
  id: item.roleId,
  titulo: item.titulo,
  dataHoraSaida: item.dataHoraSaida,
  localSaidaEndereco: item.localSaidaEndereco,
  localSaidaNome: item.localSaidaNome,
});

export const tituloSaidaMeuRole = (item: MeuRoleItem): string =>
  tituloLocal({
    nome: item.localSaidaNome ?? "",
    endereco: item.localSaidaEndereco,
  });
