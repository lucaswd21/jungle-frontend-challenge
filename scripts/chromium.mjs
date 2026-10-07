import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { createReadStream, createWriteStream } from "node:fs";
import { access, chmod, mkdir, stat, writeFile } from "node:fs/promises";
import { createBrotliDecompress } from "node:zlib";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";
/** Offline Chromium from the npm registry; no CDN download. Ignore archive ownership on managed filesystems. */
export async function prepareChromium() {
  if (process.env.CHROMIUM_EXECUTABLE_PATH)
    return process.env.CHROMIUM_EXECUTABLE_PATH;
  const require = createRequire(import.meta.url);
  const bin = join(
    dirname(require.resolve("@sparticuz/chromium")),
    "..",
    "bin",
  );
  const target = join(tmpdir(), "jungle-chromium-153");
  await mkdir(target, { recursive: true });
  const executable = join(target, "chromium");
  let complete;
  try {
    await access(join(target, ".ready"));
    complete = (await stat(executable)).size > 1000000;
  } catch {
    complete = false;
  }
  if (!complete) {
    await pipeline(
      createReadStream(join(bin, "chromium.br")),
      createBrotliDecompress(),
      createWriteStream(executable),
    );
    for (const name of ["fonts", "swiftshader", "al2023"]) {
      const destination = name === "swiftshader" ? target : join(target, name);
      await mkdir(destination, { recursive: true });
      const tar = spawn(
        "tar",
        ["--no-same-owner", "-xf", "-", "-C", destination],
        { stdio: ["pipe", "ignore", "inherit"] },
      );
      const finished = new Promise((resolve, reject) => {
        tar.once("exit", (code) =>
          code === 0
            ? resolve(undefined)
            : reject(new Error(`tar exited ${code}`)),
        );
        tar.once("error", reject);
      });
      await pipeline(
        createReadStream(join(bin, `${name}.tar.br`)),
        createBrotliDecompress(),
        tar.stdin,
      );
      await finished;
    }
    await chmod(executable, 0o755);
    await pipeline(
      createReadStream(join(bin, "fonts.tar.br")),
      createWriteStream(join(target, ".ready")),
    );
  }
  await writeFile(
    join(target, "fonts", "fonts.conf"),
    `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>${join(target, "fonts", "fonts")}</dir><dir>/usr/share/fonts</dir><cachedir>${join(target, "font-cache")}</cachedir></fontconfig>`,
  );
  process.env.FONTCONFIG_PATH = join(target, "fonts");
  process.env.LD_LIBRARY_PATH = [
    join(target, "al2023", "lib"),
    target,
    process.env.LD_LIBRARY_PATH,
  ]
    .filter(Boolean)
    .join(":");
  return executable;
}
