import {execFile} from "node:child_process";
import {appendFile, mkdtemp, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import {promisify} from "node:util";
import semanticRelease, {type PluginSpec, type VerifyReleaseContext} from "semantic-release";
import {repositoryUrl} from "../src/links.ts";

const exec = promisify(execFile);
const commitPlugins: PluginSpec[] = [
    ["@semantic-release/commit-analyzer", {preset: "conventionalcommits"}],
    ["@semantic-release/release-notes-generator", {preset: "conventionalcommits"}]
];

async function git(cwd: string, ...args: string[]) {
    return (await exec("git", args, {cwd})).stdout.trim();
}

async function previewVersion() {
    const cwd = await mkdtemp(join(tmpdir(), "regexr-release-"));
    try {
        const head = await git(".", "rev-parse", "HEAD");
        await git(".", "clone", "--quiet", "--no-checkout", "--shared", ".", cwd);
        await git(cwd, "checkout", "--quiet", "-B", "master", head);
        // semantic-release checks push access even in a dry run.
        await git(cwd, "config", "url." + pathToFileURL(cwd).href + ".insteadOf", repositoryUrl);
        const result = await semanticRelease({
            branches: ["master"], dryRun: true, repositoryUrl, plugins: commitPlugins
        }, {cwd, env: {...process.env, GIT_ALLOW_PROTOCOL: "file"}});
        const version = result ? result.nextRelease.version : "";
        if (process.env.GITHUB_OUTPUT) {
            await appendFile(process.env.GITHUB_OUTPUT, "version=" + version + "\n");
        }
        console.log(version ? "Next website version: " + version : "No website release is due.");
    } finally {
        await rm(cwd, {recursive: true, force: true});
    }
}

async function publish() {
    const {RELEASE_VERSION: version, GITHUB_SHA: source, GITHUB_REF: ref} = process.env;
    if (ref !== "refs/heads/master" || !source || !version) {
        throw new Error("Publishing requires the master workflow and its approved release preview.");
    }
    await git(".", "fetch", "--tags", "origin", "+refs/heads/master:refs/remotes/origin/master");
    if (await git(".", "rev-parse", "origin/master") !== source || await git(".", "rev-parse", "HEAD") !== source) {
        throw new Error("master has changed since this artifact was built. Use the newer workflow run.");
    }
    const result = await semanticRelease({
        branches: ["master"], repositoryUrl,
        plugins: [...commitPlugins, "@semantic-release/github"],
        verifyRelease: (_config: object, {nextRelease}: VerifyReleaseContext) => {
            if (nextRelease.version !== version || nextRelease.gitHead !== source) {
                throw new Error("The proposed release no longer matches the approved artifact.");
            }
        }
    });
    if (!result) {
        throw new Error("The approved version was not released.");
    }
}

if (process.argv.includes("--publish")) {
    await publish();
} else {
    await previewVersion();
}
