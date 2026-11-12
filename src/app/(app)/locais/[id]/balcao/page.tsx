import { TelaBalcao } from "./components/TelaBalcao";

type Props = {
  params: Promise<{ id: string }>;
};

const BalcaoPage = async ({ params }: Props) => {
  const { id } = await params;
  return <TelaBalcao localId={id} />;
};

export default BalcaoPage;
