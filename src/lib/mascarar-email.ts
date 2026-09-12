export const mascararEmail = (email: string): string => {
  const [local, dominio] = email.split("@");
  if (!local || !dominio) return "***";
  const visivel = local.slice(0, 3);
  return `${visivel}***@${dominio}`;
};
