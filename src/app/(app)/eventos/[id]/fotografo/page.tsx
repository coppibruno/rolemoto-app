import { TelaAutorizarFotografo } from "./components/TelaAutorizarFotografo";

type Props = {
  params: Promise<{ id: string }>;
};

const AutorizarFotografoPage = async ({ params }: Props) => {
  const { id } = await params;
  return (
    <main>
      <TelaAutorizarFotografo id={id} />
    </main>
  );
};

export default AutorizarFotografoPage;
