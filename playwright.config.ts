import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envE2e = resolve(__dirname, "e2e/.env.e2e");
if (existsSync(envE2e)) {
  for (const linha of readFileSync(envE2e, "utf8").split("\n")) {
    const m = linha.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const iphone = devices["iPhone 15"];

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 12_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e-report" }]],
  outputDir: "e2e-results",
  use: {
    baseURL: "http://127.0.0.1:3000",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    geolocation: { latitude: -25.4284, longitude: -49.2733 },
    permissions: ["geolocation"],
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      // WebKit ≈ Safari iOS. Sem deps do host: npm run test:e2e:iphone:chromium
      name: "iphone-webkit",
      use: { ...iphone },
    },
    {
      name: "iphone-chromium",
      use: {
        ...iphone,
        browserName: "chromium",
        defaultBrowserType: "chromium",
      },
    },
  ],
});

