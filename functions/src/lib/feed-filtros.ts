import {haversineKm} from "./geo";
import type {Evento, EventoFeedItem} from "../types/evento";
import type {Local, LocalFeedItem} from "../types/local";
import type {Role} from "../types/role";

const textoContem = (haystack: string, needle: string): boolean =>
  haystack.toLowerCase().includes(needle);

export const bateBuscaEvento = (evento: Evento, q: string): boolean => {
  const termo = q.toLowerCase();
  return (
    textoContem(evento.titulo, termo) ||
    textoContem(evento.informacoes, termo) ||
    textoContem(evento.local.endereco, termo) ||
    textoContem(evento.local.nome, termo)
  );
};

export const bateBuscaLocal = (local: Local, q: string): boolean => {
  const termo = q.toLowerCase();
  return (
    textoContem(local.nome, termo) || textoContem(local.endereco, termo)
  );
};

export const bateBuscaRole = (role: Role, q: string): boolean => {
  const termo = q.toLowerCase();
  return (
    textoContem(role.titulo, termo) ||
    textoContem(role.descricao, termo) ||
    textoContem(role.localSaida.endereco, termo) ||
    textoContem(role.destinoFinal.endereco, termo) ||
    textoContem(role.localSaida.nome, termo) ||
    textoContem(role.destinoFinal.nome, termo)
  );
};

type Origem = {lat: number; lng: number; raioKm?: 25 | 50 | 100};

export const filtrarEventosFeed = (
  eventos: Evento[],
  origem: Origem,
  q?: string,
): EventoFeedItem[] => {
  const itens: EventoFeedItem[] = [];
  for (const evento of eventos) {
    const distanciaKm = Math.round(
      haversineKm(origem.lat, origem.lng, evento.local.lat, evento.local.lng),
    );
    if (origem.raioKm !== undefined && distanciaKm > origem.raioKm) {
      continue;
    }
    if (q && !bateBuscaEvento(evento, q)) {
      continue;
    }
    itens.push({...evento, distanciaKm});
  }
  itens.sort((a, b) => a.dataHoraAbertura.localeCompare(b.dataHoraAbertura));
  return itens;
};

export const filtrarLocaisFeed = (
  locais: Local[],
  origem: Origem,
  q?: string,
): LocalFeedItem[] => {
  const itens: LocalFeedItem[] = [];
  for (const local of locais) {
    const distanciaKm = Math.round(
      haversineKm(origem.lat, origem.lng, local.lat, local.lng),
    );
    if (origem.raioKm !== undefined && distanciaKm > origem.raioKm) {
      continue;
    }
    if (q && !bateBuscaLocal(local, q)) {
      continue;
    }
    itens.push({...local, distanciaKm});
  }
  itens.sort((a, b) => a.distanciaKm - b.distanciaKm);
  return itens;
};

export const contarRolesFeed = (
  roles: Role[],
  origem: Origem,
  q?: string,
): number => {
  let total = 0;
  for (const role of roles) {
    const distancia = haversineKm(
      origem.lat,
      origem.lng,
      role.localSaida.lat,
      role.localSaida.lng,
    );
    if (origem.raioKm !== undefined && distancia > origem.raioKm) {
      continue;
    }
    if (q && !bateBuscaRole(role, q)) {
      continue;
    }
    total += 1;
  }
  return total;
};
