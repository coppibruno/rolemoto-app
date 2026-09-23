const NEXT_SEGURO = [
  /^\/$/,
  /^\/perfil$/,
  /^\/r\/[A-Za-z0-9_-]+$/,
  /^\/roles\/[A-Za-z0-9_-]+\/participar$/,
  /^\/eventos\/[A-Za-z0-9_-]+$/,
  /^\/locais\/[A-Za-z0-9_-]+$/,
];

export const destinoSeguro = (bruto: string | null | undefined): string => {
  if (!bruto) return "/";
  let valor = bruto;
  try {
    valor = decodeURIComponent(bruto);
  } catch {
    return "/";
  }
  if (!valor.startsWith("/") || valor.startsWith("//") || valor.includes("://")) {
    return "/";
  }
  const path = valor.split("?")[0];
  return NEXT_SEGURO.some((re) => re.test(path)) ? valor : "/";
};

export const urlLoginComNext = (next: string, modoCadastro = false): string => {
  const params = new URLSearchParams({ next: destinoSeguro(next) });
  if (modoCadastro) params.set("modo", "cadastro");
  return `/login?${params.toString()}`;
};

export const urlPrimeiroAcessoComNext = (next: string): string => {
  const params = new URLSearchParams({ next: destinoSeguro(next) });
  return `/primeiro-acesso?${params.toString()}`;
};

export const urlDefinirSenhaComNext = (next: string): string => {
  const params = new URLSearchParams({ next: destinoSeguro(next) });
  return `/definir-senha?${params.toString()}`;
};
