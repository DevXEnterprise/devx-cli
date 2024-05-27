import { green, cyan } from "picocolors";
import fs from "fs";
import path from "path";
import { downloadAndExtractRepo } from "./helpers/download-repo";
import { tryGitInit } from "./helpers/git-init";
import { installPackages } from "./helpers/install-packages";
import { isFolderEmpty } from "./helpers/is-folder-empty";
import { getOnline } from "./helpers/is-online";
import { isWriteable } from "./helpers/is-writeable";
import type { PackageManager } from "./helpers/get-pkg-manager";

export class DownloadError extends Error {}

export async function createApp({
  appPath,
  packageManager,
}: {
  appPath: string;
  packageManager: PackageManager;
}): Promise<void> {
  const root = path.resolve(appPath);

  if (!(await isWriteable(path.dirname(root)))) {
    console.error(
      "The application path is not writable, please check folder permissions and try again."
    );
    console.error(
      "It is likely you do not have write permissions for this folder."
    );
    process.exit(1);
  }

  const appName = path.basename(root);

  fs.mkdirSync(root, { recursive: true });
  if (!isFolderEmpty(root, appName)) {
    process.exit(1);
  }

  const useYarn = packageManager === "yarn";
  const isOnline = !useYarn || (await getOnline());
  const originalDirectory = process.cwd();

  console.log();
  console.log(`Creating a new Express.js backend in ${green(root)}.`);
  console.log();

  process.chdir(root);

  const packageJsonPath = path.join(root, "package.json");
  let hasPackageJson = false;

  try {
    await downloadAndExtractRepo(root);
  } catch (reason) {
    function isErrorLike(err: unknown): err is { message: string } {
      return (
        typeof err === "object" &&
        err !== null &&
        typeof (err as { message?: unknown }).message === "string"
      );
    }
    throw new DownloadError(isErrorLike(reason) ? reason.message : reason + "");
  }

  hasPackageJson = fs.existsSync(packageJsonPath);
  if (hasPackageJson) {
    console.log("Installing packages. This might take a couple of minutes.");
    console.log();

    await installPackages(packageManager, isOnline);
    console.log();
  }

  if (tryGitInit(root)) {
    console.log("Initialized a git repository.");
    console.log();
  }

  let cdpath: string;
  if (path.join(originalDirectory, appName) === appPath) {
    cdpath = appName;
  } else {
    cdpath = appPath;
  }

  console.log(`${green("Success!")} Created ${appName} at ${appPath}`);

  if (hasPackageJson) {
    console.log("Inside that directory, you can run several commands:");
    console.log();
    console.log(cyan(`  ${packageManager} ${useYarn ? "" : "run "}dev`));
    console.log("    Starts the development server.");
    console.log();
    console.log(cyan(`  ${packageManager} start`));
    console.log(
      "    Builds the app and Runs the built app in production mode."
    );
    console.log();
    console.log("We suggest that you begin by typing:");
    console.log();
    console.log(cyan("  cd"), cdpath);
    console.log(`  ${cyan(`${packageManager} ${useYarn ? "" : "run "}dev`)}`);
  }
  console.log();
}
