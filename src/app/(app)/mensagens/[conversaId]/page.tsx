import { TelaConversa } from "../components/TelaConversa";

type Props = {
  params: Promise<{ conversaId: string }>;
};

const ConversaPage = async ({ params }: Props) => {
  const { conversaId } = await params;
  return (
    <main>
      <TelaConversa conversaId={decodeURIComponent(conversaId ?? "").trim()} />
    </main>
  );
};

export default ConversaPage;
