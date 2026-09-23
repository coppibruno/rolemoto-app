/**
 * Lembra e-mail, senha e método de login neste aparelho.
 * Persistência local sob pedido do piloto — não substitui o Keychain.
 */
import type { User } from "firebase/auth";
import { temProviderSenha } from "./provedor-senha";

const KEY = "rolemoto.credenciais-login";
const KEY_LOGOUT = "rolemoto.logout-recente";
const KEY_AUTO = "rolemoto.auto-login-tentado";

export type MetodoLogin = "google" | "senha";

export type CredenciaisLogin = {
  email: string;
  senha: string;
  metodo: MetodoLogin;
  temSenha: boolean;
  entrarAutomatico: boolean;
  ofertaSenhaDispensada: boolean;
};

const padrao = (email: string): CredenciaisLogin => ({
  email,
  senha: "",
  metodo: "senha",
  temSenha: false,
  entrarAutomatico: false,
  ofertaSenhaDispensada: false,
});

export const mesmoEmail = (a?: string | null, b?: string | null) =>
  Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());

const storage = () => (typeof window === "undefined" ? null : window.localStorage);

const sessao = () => (typeof window === "undefined" ? null : window.sessionStorage);

export const lerCredenciais = (): CredenciaisLogin | null => {
  const bruto = storage()?.getItem(KEY);
  if (!bruto) return null;
  try {
    const parsed = JSON.parse(bruto) as Partial<CredenciaisLogin>;
    if (typeof parsed.email !== "string" || !parsed.email.trim()) return null;
    return {
      ...padrao(parsed.email.trim()),
      senha: typeof parsed.senha === "string" ? parsed.senha : "",
      metodo: parsed.metodo === "google" ? "google" : "senha",
      temSenha: Boolean(parsed.temSenha),
      entrarAutomatico: Boolean(parsed.entrarAutomatico),
      ofertaSenhaDispensada: Boolean(parsed.ofertaSenhaDispensada),
    };
  } catch {
    return null;
  }
};

export const salvarCredenciais = (credenciais: CredenciaisLogin) => {
  storage()?.setItem(KEY, JSON.stringify(credenciais));
};

export const limparCredenciais = () => {
  storage()?.removeItem(KEY);
};

export const persistirAposSenha = (opts: {
  email: string;
  senha: string;
  salvarSenha: boolean;
  entrarAutomatico: boolean;
}) => {
  const atual = lerCredenciais();
  const mesmo = mesmoEmail(atual?.email, opts.email);
  salvarCredenciais({
    email: opts.email.trim(),
    senha: opts.salvarSenha ? opts.senha : "",
    metodo: "senha",
    temSenha: true,
    entrarAutomatico: opts.salvarSenha && opts.entrarAutomatico,
    ofertaSenhaDispensada: mesmo ? Boolean(atual?.ofertaSenhaDispensada) : false,
  });
};

export const lembrarConta = (user: User) => {
  if (!user.email) return;
  const atual = lerCredenciais();
  const mesmo = mesmoEmail(atual?.email, user.email);
  const google = user.providerData.some((p) => p.providerId === "google.com");
  const senha = temProviderSenha(user);
  salvarCredenciais({
    email: user.email,
    senha: mesmo ? atual?.senha ?? "" : "",
    metodo: senha && !google ? "senha" : google ? "google" : "senha",
    temSenha: senha,
    entrarAutomatico: mesmo ? Boolean(atual?.entrarAutomatico) : false,
    ofertaSenhaDispensada: mesmo ? Boolean(atual?.ofertaSenhaDispensada) : false,
  });
};

export const dispensarOfertaSenha = (email: string) => {
  const atual = lerCredenciais();
  const mesmo = mesmoEmail(atual?.email, email);
  salvarCredenciais({
    ...(mesmo && atual ? atual : padrao(email.trim())),
    email: email.trim(),
    ofertaSenhaDispensada: true,
  });
};

export const precisaDefinirSenha = (user: User | null) => {
  if (!user?.email || temProviderSenha(user)) return false;
  const salvas = lerCredenciais();
  return !(mesmoEmail(salvas?.email, user.email) && salvas?.ofertaSenhaDispensada);
};

export const contaGoogleSemSenha = (email: string) => {
  const salvas = lerCredenciais();
  return Boolean(
    mesmoEmail(salvas?.email, email) &&
      salvas?.metodo === "google" &&
      !salvas.temSenha &&
      !salvas.senha,
  );
};

export const marcarLogoutRecente = () => {
  sessao()?.setItem(KEY_LOGOUT, "1");
  sessao()?.removeItem(KEY_AUTO);
};

export const houveLogoutRecente = () => sessao()?.getItem(KEY_LOGOUT) === "1";

export const deveTentarAutoLogin = (credenciais: CredenciaisLogin) => {
  if (!credenciais.senha || !credenciais.entrarAutomatico) return false;
  if (houveLogoutRecente()) return false;
  const s = sessao();
  if (!s || s.getItem(KEY_AUTO) === "1") return false;
  s.setItem(KEY_AUTO, "1");
  return true;
};
