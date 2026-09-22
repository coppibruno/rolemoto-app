import { TelaGerenciarRole } from "./components/TelaGerenciarRole";

type Props = { params: Promise<{ id: string }> };

const GerenciarRolePage = async ({ params }: Props) => {
  const { id } = await params;
  return (
    <main>
      <TelaGerenciarRole roleId={id} />
    </main>
  );
};

export default GerenciarRolePage;
