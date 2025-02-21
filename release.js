#!/usr/bin/env node

import fs from "node:fs";
import readline from "node:readline";
import simpleGit from "simple-git";
import https from "node:https";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

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

async function updateDockerComposeFile(newVersion) {
  const composeFilePath = "./docker-compose.yaml";
  const composeFileContent = fs.readFileSync(composeFilePath, "utf-8");

  // Add a version comment or an unused environment variable to reflect current version
  const updatedComposeContent = composeFileContent.replace(
    /# Version: .*/,
    `# Version: ${newVersion}`,
  );

  fs.writeFileSync(composeFilePath, updatedComposeContent);

  console.log(`Updated docker-compose.yaml with version ${newVersion}`);
}

async function commitAndPushChanges(newVersion) {
  try {
    // Stage changes
    await git.add("./package.json");
    await git.add("./Dockerfile");
    await git.add("./docker-compose.yaml");
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

function notifyPortainer(webhookUrl) {
  const data = JSON.stringify({
    message: "New version released and pushed",
  });

  const url = new URL(webhookUrl);
  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": data.length,
    },
  };

  const req = https.request(options, (res) => {
    console.log(`Webhook STATUS: ${res.statusCode}`);
    res.on("data", (d) => {
      process.stdout.write(d);
    });
  });

  req.on("error", (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.write(data);
  req.end();
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
        await updateDockerComposeFile(newVersion);
        await commitAndPushChanges(newVersion);
        await tagGitVersion(newVersion);

        // Notify Portainer if the webhook URL is set
        const webhookUrl = process.env.PORTAINER_WEBHOOK_URL;
        if (webhookUrl) {
          notifyPortainer(webhookUrl);
        } else {
          console.log("No webhook URL provided, skipping notification.");
        }
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
