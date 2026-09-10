import { TelaConfirmacaoRole } from "./components/TelaConfirmacaoRole";

type Props = { params: Promise<{ id: string }> };

const ParticiparPage = async ({ params }: Props) => {
  const { id } = await params;
  return (
    <main>
      <TelaConfirmacaoRole roleId={id} />
    </main>
  );
};

export default ParticiparPage;
