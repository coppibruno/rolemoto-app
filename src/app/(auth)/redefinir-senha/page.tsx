import type { Metadata } from "next";
import { TelaRedefinirSenha } from "./components/TelaRedefinirSenha";

export const metadata: Metadata = {
  title: "Criar nova senha · Rolê Moto",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ oobCode?: string; mode?: string }> };

const RedefinirSenhaPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const oobCode = typeof params.oobCode === "string" ? params.oobCode : "";
  const mode = typeof params.mode === "string" ? params.mode : "";

  return (
    <main>
      <TelaRedefinirSenha oobCode={oobCode} mode={mode} />
    </main>
  );
};

export default RedefinirSenhaPage;
