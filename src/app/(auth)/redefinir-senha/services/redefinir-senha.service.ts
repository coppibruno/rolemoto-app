import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/lib/firebase";

export const verificarCodigoReset = (oobCode: string): Promise<string> =>
  verifyPasswordResetCode(auth, oobCode);

export const confirmarNovaSenha = (oobCode: string, senha: string): Promise<void> =>
  confirmPasswordReset(auth, oobCode, senha);
