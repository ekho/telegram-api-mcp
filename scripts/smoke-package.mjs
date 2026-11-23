import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const archive = process.argv[2];
assert.ok(archive, "Usage: npm run smoke:package -- /path/to/package.tgz");
assert.ok(process.env.npm_execpath, "Run this check through npm run smoke:package");
const expected = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const directory = mkdtempSync(path.join(tmpdir(), "telegram-mcp-package-"));
const client = new Client({ name: "package-smoke-test", version: "1.0.0" });
let timer;

try {
  execFileSync(process.execPath, [
    process.env.npm_execpath, "install", "--prefix", directory,
    "--ignore-scripts", "--no-audit", "--no-fund", "--package-lock=false",
    path.resolve(archive),
  ], { stdio: "pipe", timeout: 120_000 });

  const packageRoot = path.join(directory, "node_modules", expected.name);
  const installed = JSON.parse(readFileSync(path.join(packageRoot, "package.json"), "utf8"));
  assert.equal(installed.name, expected.name);
  assert.equal(installed.version, expected.version);
  assert.ok(installed.bin?.["telegram-api-mcp"], "The package must expose its CLI");
  const entry = path.join(packageRoot, installed.bin["telegram-api-mcp"]);
  assert.ok(existsSync(entry), "The packed CLI is missing: build dist/index.js before publishing");
  assert.match(readFileSync(entry, "utf8"), /^#!\/usr\/bin\/env node\r?\n/);

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [entry],
    cwd: directory,
    env: {
      ...Object.fromEntries(Object.entries(process.env).filter(([, value]) => typeof value === "string")),
      TELEGRAM_BOT_TOKEN: "ci-smoke-test-not-a-real-token",
      TELEGRAM_ALLOWED_UPLOAD_DIRS: directory,
      TELEGRAM_META_MODE: "false",
    },
    stderr: "pipe",
  });
  transport.stderr?.on("data", (chunk) => process.stderr.write(chunk));
  await Promise.race([
    (async () => {
      await client.connect(transport);
      const { tools } = await client.listTools();
      assert.ok(tools.some((tool) => tool.name === "get_me"), "Telegram tools must be registered");
      assert.ok(tools.some((tool) => tool.name === "send_message"), "Message tool must be registered");
      console.log(`Packed ${installed.name}@${installed.version}: MCP initialize and tools/list passed (${tools.length} tools).`);
    })(),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("MCP package smoke test timed out")), 30_000);
    }),
  ]);
} finally {
  clearTimeout(timer);
  await client.close();
  rmSync(directory, { recursive: true, force: true });
}
