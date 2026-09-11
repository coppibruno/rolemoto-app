import { TelaLogin } from "./components/TelaLogin";

type Props = {
  searchParams: Promise<{ next?: string; modo?: string }>;
};

const LoginPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : null;
  const modoCadastro = params.modo === "cadastro";

  return <TelaLogin next={next} modoCadastro={modoCadastro} />;
};

export default LoginPage;
