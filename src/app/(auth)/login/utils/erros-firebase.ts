const ERROS_FIREBASE: Record<string, string> = {
  "auth/email-already-in-use": "Este email já está cadastrado.",
  "auth/invalid-email": "Email inválido.",
  "auth/weak-password": "A senha deve ter no mínimo 6 caracteres.",
  "auth/user-not-found": "Nenhuma conta encontrada com este email.",
  "auth/wrong-password": "Senha incorreta.",
  "auth/invalid-credential": "Email ou senha incorretos.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde um momento.",
  "auth/popup-closed-by-user": "",
  "auth/credential-already-in-use": "Este e-mail já tem senha em outra conta.",
  "auth/provider-already-linked": "Esta conta já tem senha.",
  "auth/requires-recent-login": "Entre de novo com o Google para criar a senha.",
};

export const traduzirErroFirebase = (codigo: string): string =>
  ERROS_FIREBASE[codigo] || "Erro ao autenticar. Tente novamente.";

export const extrairCodigoErro = (error: unknown): string =>
  (error as { code?: string })?.code || "";
