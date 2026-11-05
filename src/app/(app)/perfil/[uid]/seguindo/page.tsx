import type { AbaSeguir } from "@/types/seguir";
import { TelaListasSeguir } from "./components/TelaListasSeguir";

type Props = {
  params: Promise<{ uid: string }>;
  searchParams: Promise<{ aba?: string }>;
};

const PaginaSeguindo = async ({ params, searchParams }: Props) => {
  const { uid } = await params;
  const { aba } = await searchParams;
  const abaInicial: AbaSeguir = aba === "seguidores" ? "seguidores" : "seguindo";
  const uidLimpo = typeof uid === "string" ? uid.trim() : "";

  return (
    <main>
      <TelaListasSeguir uid={uidLimpo} abaInicial={abaInicial} />
    </main>
  );
};

export default PaginaSeguindo;
