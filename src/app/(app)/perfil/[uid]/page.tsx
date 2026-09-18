import { TelaPerfilPublico } from "./components/TelaPerfilPublico";

type Props = {
  params: Promise<{ uid: string }>;
};

const PerfilPublicoPage = async ({ params }: Props) => {
  const { uid } = await params;
  const uidLimpo = typeof uid === "string" ? uid.trim() : "";

  return (
    <main>
      <TelaPerfilPublico uid={uidLimpo} />
    </main>
  );
};

export default PerfilPublicoPage;
