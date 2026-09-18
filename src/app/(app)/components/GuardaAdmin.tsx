"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  children: React.ReactNode;
};

export const GuardaAdmin = ({ children }: Props) => {
  const router = useRouter();
  const { usuario } = useAuth();

  useEffect(() => {
    if (usuario && !usuario.admin) {
      router.replace("/");
    }
  }, [usuario, router]);

  if (!usuario?.admin) {
    return null;
  }

  return <>{children}</>;
};
