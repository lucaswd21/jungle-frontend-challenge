import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { tmpdir } from "node:os";
import { join } from "node:path";
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";
import { prepareChromium } from "./chromium.mjs";
const base = process.env.AUDIT_URL ?? "http://127.0.0.1:4173";
const executablePath =
  process.env.CHROMIUM_EXECUTABLE_PATH || (await prepareChromium());
const preview = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4173",
    "--strictPort",
  ],
  { stdio: "ignore" },
);
try {
  let ready = false;
  for (let tries = 0; tries < 40 && !ready; tries++) {
    try {
      ready = (await fetch(base)).ok;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  if (!ready) throw new Error("Production preview did not start");
  await mkdir("reports/lighthouse", { recursive: true });
  const rows = [];
  for (const [page, path] of [
    ["home", "/"],
    ["detail", "/nfts/nft-1"],
  ]) {
    for (const profile of ["mobile", "desktop"]) {
      const results = [];
      for (let run = 1; run <= 3; run++) {
        const port = 9300 + run;
        const profileDirectory = await mkdtemp(
          join(tmpdir(), "jungle-lighthouse-"),
        );
        const chrome = spawn(
          executablePath,
          [
            `--user-data-dir=${profileDirectory}`,
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--no-zygote",
            "--headless",
            `--remote-debugging-port=${port}`,
            "about:blank",
          ],
          { stdio: "ignore" },
        );
        try {
          // Poll readiness; do not assume fixed machine timing.
          let connected = false;
          for (let tries = 0; tries < 30 && !connected; tries++) {
            try {
              const response = await fetch(
                `http://127.0.0.1:${port}/json/version`,
              );
              connected = response.ok;
            } catch {
              await new Promise((resolve) => setTimeout(resolve, 200));
            }
          }
          if (!connected)
            throw new Error("Chromium debugging endpoint did not become ready");
          const result = await lighthouse(
            `${base}${path}`,
            {
              port,
              output: ["html", "json"],
              logLevel: "error",
              onlyCategories: [
                "performance",
                "accessibility",
                "best-practices",
                "seo",
              ],
            },
            profile === "desktop" ? desktopConfig : undefined,
          );
          if (!result) throw new Error("Lighthouse did not return a result");
          if (result.lhr.runtimeError)
            throw new Error(result.lhr.runtimeError.message);
          const stem = `reports/lighthouse/${page}-${profile}-${run}`;
          await writeFile(`${stem}.html`, result.report[0]);
          await writeFile(`${stem}.json`, result.report[1]);
          const categories = Object.fromEntries(
            Object.entries(result.lhr.categories).map(([key, category]) => [
              key,
              Math.round(category.score * 100),
            ]),
          );
          const metrics = Object.fromEntries(
            [
              "largest-contentful-paint",
              "cumulative-layout-shift",
              "total-blocking-time",
            ].map((key) => [key, result.lhr.audits[key].numericValue]),
          );
          results.push({ ...categories, ...metrics });
          console.log(page, profile, run, categories);
        } finally {
          if (chrome.exitCode === null) {
            const exited = once(chrome, "exit");
            chrome.kill("SIGTERM");
            await exited;
          }
          await rm(profileDirectory, { recursive: true, force: true });
        }
      }
      const medians = Object.fromEntries(
        Object.keys(results[0]).map((key) => [
          key,
          results.map((row) => row[key]).sort((a, b) => a - b)[1],
        ]),
      );
      rows.push({ page, profile, medians, runs: results });
    }
  }
  await writeFile(
    "reports/lighthouse/summary.json",
    JSON.stringify(
      {
        node: process.version,
        platform: process.platform,
        architecture: process.arch,
        base,
        conditions:
          "Production preview, default mocks, bundled Chromium, isolated temporary profile for each run; Lighthouse standard simulated throttling; no audit-only data/assets.",
        measurements: rows,
      },
      null,
      2,
    ),
  );
  console.log("Reports: reports/lighthouse/summary.json");
} finally {
  preview.kill("SIGTERM");
}
