"use client";

import { useState } from "react";
import type { AbaTipoGaragem } from "@/types/meus-roles";

export const useAbaTipoGaragem = (inicial: AbaTipoGaragem = "roles") => {
  const [abaTipo, setAbaTipo] = useState<AbaTipoGaragem>(inicial);
  return { abaTipo, setAbaTipo };
};
