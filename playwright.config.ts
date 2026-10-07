import { defineConfig, devices } from "@playwright/test";
import { prepareChromium } from "./scripts/chromium.mjs";
const executablePath =
  process.env.CHROMIUM_EXECUTABLE_PATH ||
  (process.platform === "linux" ? await prepareChromium() : undefined);
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: {
      executablePath,
      args:
        process.platform === "linux"
          ? [
              "--no-sandbox",
              "--disable-dev-shm-usage",
              "--no-zygote",
              "--use-angle=swiftshader",
              "--enable-unsafe-swiftshader",
            ]
          : [],
    },
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 390, height: 844 },
        defaultBrowserType: "chromium",
      },
    },
  ],
  webServer: {
    command: "npm run preview",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
});
