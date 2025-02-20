#!/usr/bin/env node

import fs from "node:fs";
import readline from "node:readline";
import { execSync } from "node:child_process";
import simpleGit from "simple-git";

const git = simpleGit();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function getNextVersion(currentVersion, releaseType) {
  const [major, minor, patch] = currentVersion.split(".").map(Number);

  switch (releaseType) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(
        'Invalid release type. Use "major", "minor", or "patch".',
      );
  }
}

function readCurrentVersion() {
  const packageJsonPath = "./package.json";
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  return packageJson.version;
}

async function updatePackageVersion(newVersion) {
  const packageJsonPath = "./package.json";

  // Read the current package.json file
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

  // Update the version number
  packageJson.version = newVersion;

  // Write the changes back to the package.json file
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  console.log(`Updated package.json version to ${newVersion}`);
}

async function updateDockerfileVersionLabel(newVersion) {
  const dockerfilePath = "./Dockerfile";
  const dockerfileContent = fs.readFileSync(dockerfilePath, "utf-8");

  // Use a regular expression to find the LABEL version line and replace it with the new version
  const updatedDockerfileContent = dockerfileContent.replace(
    /LABEL version="[^"]*"/,
    `LABEL version="${newVersion}"`,
  );

  fs.writeFileSync(dockerfilePath, updatedDockerfileContent);

  console.log(`Updated Dockerfile version label to ${newVersion}`);
}

async function commitAndPushChanges(newVersion) {
  try {
    // Stage changes
    await git.add("./package.json");
    await git.add("./Dockerfile");
    await git.commit(`Update version to ${newVersion}`);
    await git.push();

    console.log("Changes committed and pushed to the remote repository");
  } catch (err) {
    console.error("Error during Git operations:", err);
  }
}

async function tagGitVersion(newVersion) {
  try {
    await git.addTag(newVersion);
    await git.pushTags();

    console.log(`Created and pushed Git tag: ${newVersion}`);
  } catch (err) {
    console.error("Error during Git tag operations:", err);
  }
}

async function release(releaseType) {
  const currentVersion = readCurrentVersion();
  const newVersion = getNextVersion(currentVersion, releaseType);

  console.log(`Current version: ${currentVersion}`);
  console.log(`New version: ${newVersion}`);

  rl.question(
    "Do you want to proceed with this version update? (y/n) ",
    async (answer) => {
      if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
        await updatePackageVersion(newVersion);
        await updateDockerfileVersionLabel(newVersion);
        await commitAndPushChanges(newVersion);
        await tagGitVersion(newVersion);
      } else {
        console.log("Version update canceled.");
      }
      rl.close();
    },
  );
}

const releaseType = process.argv[2];

if (releaseType) {
  try {
    release(releaseType);
  } catch (error) {
    console.error(
      "An error occurred during the release process:",
      error.message,
    );
  }
} else {
  console.error(
    "Please specify a release type. Usage: node release.js <major|minor|patch>",
  );
}
