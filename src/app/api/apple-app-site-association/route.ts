const CAMINHOS = [
  "/r/*",
  "/e/*",
  "/l/*",
  "/perfil/*",
  "/eventos/*",
  "/locais/*",
  "/roles/*",
  "/telemetria/*",
  "/redefinir-senha",
];

/** Universal Links. Sem APPLE_TEAM_ID o arquivo não associa app nenhum. */
export const GET = () => {
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  const details = teamId
    ? [{ appID: `${teamId}.br.com.rolemoto.app`, paths: CAMINHOS }]
    : [];

  return Response.json(
    { applinks: { apps: [], details } },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
};
