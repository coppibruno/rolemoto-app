import type { User } from "firebase/auth";

export const temProviderSenha = (user: User | null) =>
  Boolean(user?.providerData.some((provider) => provider.providerId === "password"));
