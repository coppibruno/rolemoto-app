import {describe, expect, it} from "vitest";
import {payloadParaInbox, tipoNaInbox, urlInboxValida} from "./notificacao-inbox";

describe("notificacao-inbox", () => {
  it("allowlist aceita social e operacional, recusa mensagem e story", () => {
    expect(tipoNaInbox("novo_seguidor")).toBe("novo_seguidor");
    expect(tipoNaInbox("lembrete_role")).toBe("lembrete_role");
    expect(tipoNaInbox("mensagem")).toBeNull();
    expect(tipoNaInbox("story_local")).toBeNull();
    expect(tipoNaInbox("curtida")).toBeNull();
  });

  it("url exige path interno", () => {
    expect(urlInboxValida("/perfil/abc")).toBe("/perfil/abc");
    expect(urlInboxValida("https://x.com")).toBeNull();
    expect(urlInboxValida("//evil")).toBeNull();
    expect(urlInboxValida("perfil")).toBeNull();
  });

  it("payloadParaInbox monta create ou null", () => {
    expect(
      payloadParaInbox("u1", {
        tipo: "novo_seguidor",
        title: "Ana te seguiu",
        body: "Ana te seguiu",
        url: "/perfil/ana",
        roleId: "",
        localId: "",
        eventoId: "",
        atorUid: "ana",
      }),
    ).toEqual({
      usuarioId: "u1",
      tipo: "novo_seguidor",
      title: "Ana te seguiu",
      body: "Ana te seguiu",
      url: "/perfil/ana",
      atorUid: "ana",
      roleId: "",
      localId: "",
      eventoId: "",
    });

    expect(
      payloadParaInbox("u1", {
        tipo: "mensagem",
        title: "Oi",
        body: "Oi",
        url: "/mensagens/x",
        roleId: "",
        localId: "",
        eventoId: "",
      }),
    ).toBeNull();

    expect(
      payloadParaInbox("u1", {
        tipo: "aceite_vaga",
        title: "",
        body: "rolê",
        url: "/roles/1/participar",
        roleId: "1",
        localId: "",
        eventoId: "",
      }),
    ).toBeNull();
  });
});
