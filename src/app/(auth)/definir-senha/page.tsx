import { TelaDefinirSenha } from "./components/TelaDefinirSenha";

type Props = {
  searchParams: Promise<{ next?: string }>;
};

const DefinirSenhaPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : null;

  return <TelaDefinirSenha next={next} />;
};

export default DefinirSenhaPage;
