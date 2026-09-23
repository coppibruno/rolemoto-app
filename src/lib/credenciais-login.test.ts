import { beforeEach, describe, expect, it } from "vitest";
import type { User } from "firebase/auth";
import {
  contaGoogleSemSenha,
  dispensarOfertaSenha,
  lembrarConta,
  lerCredenciais,
  limparCredenciais,
  precisaDefinirSenha,
  persistirAposSenha,
} from "./credenciais-login";

const memoria = new Map<string, string>();
const storageFake = {
  getItem: (chave: string) => memoria.get(chave) ?? null,
  setItem: (chave: string, valor: string) => {
    memoria.set(chave, valor);
  },
  removeItem: (chave: string) => {
    memoria.delete(chave);
  },
};

const user = (email: string, providers: string[]): User =>
  ({
    email,
    providerData: providers.map((providerId) => ({ providerId })),
  }) as User;

beforeEach(() => {
  memoria.clear();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: storageFake, sessionStorage: storageFake },
  });
  limparCredenciais();
});

describe("credenciais-login", () => {
  it("salva e-mail e senha quando o piloto pede", () => {
    persistirAposSenha({
      email: "piloto@rolemoto.com",
      senha: "segredo1",
      salvarSenha: true,
      entrarAutomatico: true,
    });

    const salvas = lerCredenciais();
    expect(salvas?.email).toBe("piloto@rolemoto.com");
    expect(salvas?.senha).toBe("segredo1");
    expect(salvas?.entrarAutomatico).toBe(true);
    expect(salvas?.temSenha).toBe(true);
  });

  it("não guarda a senha se o piloto recusar", () => {
    persistirAposSenha({
      email: "piloto@rolemoto.com",
      senha: "segredo1",
      salvarSenha: false,
      entrarAutomatico: true,
    });

    const salvas = lerCredenciais();
    expect(salvas?.senha).toBe("");
    expect(salvas?.entrarAutomatico).toBe(false);
  });

  it("oferece criar senha só para conta Google sem senha e sem dispensa", () => {
    const google = user("a@b.com", ["google.com"]);
    expect(precisaDefinirSenha(google)).toBe(true);

    dispensarOfertaSenha("a@b.com");
    expect(precisaDefinirSenha(google)).toBe(false);
    expect(precisaDefinirSenha(user("a@b.com", ["google.com", "password"]))).toBe(
      false,
    );
  });

  it("reconhece conta Google sem senha salva", () => {
    lembrarConta(user("a@b.com", ["google.com"]));
    expect(contaGoogleSemSenha("a@b.com")).toBe(true);
    expect(contaGoogleSemSenha("outro@b.com")).toBe(false);
  });
});
