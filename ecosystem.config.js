// PM2 config. Reads the PERSISTENT env file (outside the deploy dir) and injects it
// into both processes, so redeploys never touch secrets or the DB path.
const fs = require("fs");
const os = require("os");
const path = require("path");

function loadEnv(file) {
  const env = {};
  try {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      env[m[1]] = v;
    }
  } catch { /* file missing — rely on process env */ }
  return env;
}

const ENV_FILE = process.env.ENV_FILE || path.join(os.homedir(), "budget-data", ".env");
const shared = loadEnv(ENV_FILE);
const STANDALONE = path.join(__dirname, ".next", "standalone");

module.exports = {
  apps: [
    {
      name: "budget-web",
      script: "server.js",
      cwd: STANDALONE,
      env: { ...shared, NODE_ENV: "production", PORT: shared.PORT || "3000", HOSTNAME: "127.0.0.1" },
    },
    {
      name: "budget-bot",
      script: "bot.js",
      cwd: STANDALONE,
      env: { ...shared, NODE_ENV: "production" },
    },
  ],
};
