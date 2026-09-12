/** Origin do PWA (`APP_ORIGIN`), sem barra final. */
export const origemApp = (): string => {
  const origem = process.env.APP_ORIGIN?.trim();
  if (!origem) {
    return "";
  }
  return origem.replace(/\/$/, "");
};
