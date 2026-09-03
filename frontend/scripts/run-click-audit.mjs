import { spawn } from "node:child_process";

const MAX_ATTEMPTS = 2;

function runAudit() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["scripts/audit-all-clicks.mjs"], {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
    });

    child.once("exit", (code, signal) => {
      if (signal) {
        resolve(1);
        return;
      }
      resolve(code ?? 1);
    });
  });
}

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  const exitCode = await runAudit();
  if (exitCode === 0) process.exit(0);

  if (attempt < MAX_ATTEMPTS) {
    console.warn(`Click audit attempt ${attempt} failed; retrying once with a fresh Chrome/CDP session.`);
  } else {
    console.error(`Click audit failed after ${MAX_ATTEMPTS} independent attempts.`);
    process.exit(exitCode);
  }
}
