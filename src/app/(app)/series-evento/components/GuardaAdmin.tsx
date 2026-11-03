"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  children: ReactNode;
};

export const GuardaAdmin = ({ children }: Props) => {
  const router = useRouter();
  const { usuario } = useAuth();
  const admin = usuario?.admin === true;

  useEffect(() => {
    if (usuario && !admin) {
      router.replace("/");
    }
  }, [usuario, admin, router]);

  if (!usuario || !admin) {
    return null;
  }

  return children;
};
