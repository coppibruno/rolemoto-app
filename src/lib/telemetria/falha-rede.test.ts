import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
      this.name = "ApiError";
    }
  },
}));

import { ApiError } from "@/lib/api";
import { isErroAuth, isFalhaDeRede } from "./falha-rede";

describe("isFalhaDeRede", () => {
  it("detecta TypeError de fetch", () => {
    expect(isFalhaDeRede(new TypeError("Failed to fetch"))).toBe(true);
  });

  it("não trata 4xx como rede", () => {
    expect(isFalhaDeRede(new ApiError(400, "título inválido"))).toBe(false);
  });
});

describe("isErroAuth", () => {
  it("reconhece 401 e 403", () => {
    expect(isErroAuth(new ApiError(401, "não autenticado"))).toBe(true);
    expect(isErroAuth(new ApiError(403, "proibido"))).toBe(true);
    expect(isErroAuth(new ApiError(400, "inválido"))).toBe(false);
  });
});
