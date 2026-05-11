import { constants } from "node:fs";
import { access, readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const packageJsonPath = path.join(projectRoot, "package.json");
const releaseDir = path.join(projectRoot, "release-cloudflare");
const wranglerScript = path.join(projectRoot, "node_modules", "wrangler", "bin", "wrangler.js");

const productionBranch = "main";
const previewBranch = "staging";

const ensurePath = async (targetPath, label) => {
  try {
    await access(targetPath, constants.F_OK);
  } catch {
    throw new Error(`Missing ${label}: ${path.relative(projectRoot, targetPath)}`);
  }
};

const getConfiguredPagesProjectName = async () => {
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
  const projectName = packageJson?.config?.pagesProjectName;

  if (typeof projectName !== "string" || projectName.trim() === "") {
    throw new Error('package.json must define "config.pagesProjectName".');
  }

  return projectName.trim();
};

const ensureReleaseOutput = async () => {
  await ensurePath(releaseDir, "release directory");
  await ensurePath(path.join(releaseDir, "index.html"), "release homepage");
  await ensurePath(path.join(releaseDir, "_headers"), "release _headers file");
  await ensurePath(path.join(releaseDir, "_redirects"), "release _redirects file");
};

const runWrangler = async (args, options = {}) => {
  await ensurePath(wranglerScript, "Wrangler script");

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [wranglerScript, ...args], {
      cwd: projectRoot,
      env: process.env,
      shell: false,
      stdio: options.capture ? ["inherit", "pipe", "pipe"] : "inherit"
    });

    let stdout = "";
    let stderr = "";

    if (options.capture) {
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      const details = [stdout.trim(), stderr.trim()].filter(Boolean).join("\n");
      reject(new Error(details ? `Wrangler exited with code ${code}.\n${details}` : `Wrangler exited with code ${code}.`));
    });
  });
};

const check = async () => {
  await ensureReleaseOutput();

  const projectName = await getConfiguredPagesProjectName();

  const { stdout } = await runWrangler(["pages", "project", "list", "--json"], { capture: true });
  const projects = JSON.parse(stdout);
  const matchingProject = projects.find((project) => project["Project Name"] === projectName);

  if (!matchingProject) {
    throw new Error(`Pages project "${projectName}" was not found in wrangler pages project list output.`);
  }

  console.log(`Validated release-cloudflare/ and Cloudflare Pages access for "${projectName}".`);
};

const deploy = async (branch) => {
  await ensureReleaseOutput();

  const projectName = await getConfiguredPagesProjectName();
  await runWrangler(["pages", "deploy", "./release-cloudflare", "--project-name", projectName, "--branch", branch]);
};

const create = async () => {
  const projectName = await getConfiguredPagesProjectName();
  await runWrangler(["pages", "project", "create", projectName, "--production-branch", productionBranch]);
};

const command = process.argv[2];

try {
  if (command === "check") {
    await check();
  } else if (command === "create") {
    await create();
  } else if (command === "deploy-prod") {
    await deploy(productionBranch);
  } else if (command === "deploy-staging") {
    await deploy(previewBranch);
  } else {
    throw new Error(`Unknown command: ${command ?? "<missing>"}`);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
