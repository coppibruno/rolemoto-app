import { TelaConvidarEvento } from "./components/TelaConvidarEvento";

type Props = {
  params: Promise<{ id: string }>;
};

const ConvidarEventoPage = async ({ params }: Props) => {
  const { id } = await params;
  return (
    <main>
      <TelaConvidarEvento id={id} />
    </main>
  );
};

export default ConvidarEventoPage;
