import type { Metadata } from "next";
import { TelaAfiliado } from "./components/TelaAfiliado";

type Props = { params: Promise<{ codigo: string }> };

export const metadata: Metadata = {
  title: "Rolê Moto · Rolês de moto perto de você",
  description: "Encontre e organize rolês de moto com outros pilotos. Grátis.",
};

const AfiliadoPage = async ({ params }: Props) => {
  const { codigo } = await params;
  return (
    <main>
      <TelaAfiliado codigo={decodeURIComponent(codigo ?? "")} />
    </main>
  );
};

export default AfiliadoPage;
