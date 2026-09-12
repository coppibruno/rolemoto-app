import { TelaLogin } from "./components/TelaLogin";

type Props = {
  searchParams: Promise<{ next?: string; modo?: string; senhaRedefinida?: string }>;
};

const LoginPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : null;
  const modoCadastro = params.modo === "cadastro";
  const senhaRedefinida = params.senhaRedefinida === "1";

  return (
    <TelaLogin
      next={next}
      modoCadastro={modoCadastro}
      senhaRedefinida={senhaRedefinida}
    />
  );
};

export default LoginPage;
