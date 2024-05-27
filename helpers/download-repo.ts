import tar from "tar";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import fs from "fs";
import path from "path";

async function downloadTarStream(url: string) {
  const res = await fetch(url);

  if (!res.body) {
    throw new Error(`Failed to download: ${url}`);
  }

  return Readable.fromWeb(res.body as import("stream/web").ReadableStream);
}

export async function downloadAndExtractRepo(root: string) {
  await pipeline(
    await downloadTarStream(
      "https://codeload.github.com/DevXEnterprise/backend/tar.gz/main"
    ),
    tar.x({
      C: root,
      strip: 1,
    })
  );
  fs.rmSync(path.join(root, ".git"), { recursive: true, force: true });
}
