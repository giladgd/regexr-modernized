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

async function setInitialTag(cwd: string) {
    if (await git(cwd, "tag", "--list", "--merged", "HEAD", "v4.0.0")) {
        return;
    }
    const baseline = await git(cwd, "log", "--reverse", "--format=%H", "-S", '"version": "4.0.0"', "--", "package.json");
    if (!baseline) {
        throw new Error("Could not find the existing 4.0.0 version in Git history.");
    }
    await git(cwd, "tag", "v4.0.0", baseline.split("\n")[0]);
}

async function previewVersion() {
    const cwd = await mkdtemp(join(tmpdir(), "regexr-release-"));
    try {
        const head = await git(".", "rev-parse", "HEAD");
        await git(".", "clone", "--quiet", "--no-checkout", "--shared", ".", cwd);
        await git(cwd, "checkout", "--quiet", "-B", "master", head);
        await setInitialTag(cwd);
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
        throw new Error("Publishing requires the master workflow and its approved artifact version.");
    }
    const tag = "v" + version;
    const message = "chore(release): " + version + " [skip ci]";
    await git(".", "fetch", "--tags", "origin", "+refs/heads/master:refs/remotes/origin/master");
    const tip = await git(".", "rev-parse", "origin/master");
    if (tip !== source) {
        const tags = await git(".", "tag", "--merged", tip, "--sort=-version:refname", "--list", "v[0-9]*");
        if (tags.split("\n")[0] === tag && await git(".", "rev-parse", tag + "^") === source &&
            await git(".", "log", "-1", "--format=%s", tag) === message) {
            try {
                await exec("gh", ["release", "view", tag]);
            } catch {
                await exec("gh", ["release", "create", tag, "--verify-tag", "--generate-notes", "--title", tag]);
            }
            return;
        }
        const parent = await git(".", "rev-parse", "origin/master^");
        const subject = await git(".", "log", "-1", "--format=%s", "origin/master");
        if (parent !== source || subject !== message) {
            throw new Error("master has changed since this artifact was built. Use the newer workflow run.");
        }
    }
    await git(".", "switch", "-C", "master", tip);
    await setInitialTag(".");
    const result = await semanticRelease({
        branches: ["master"],
        repositoryUrl: await git(".", "config", "--get", "remote.origin.url"),
        plugins: [
            ...commitPlugins,
            ["@semantic-release/npm", {npmPublish: false}],
            ["@semantic-release/git", {assets: ["package.json", "package-lock.json"], message}],
            ["@semantic-release/github", {assets: []}]
        ],
        verifyRelease: (_config: object, {nextRelease}: VerifyReleaseContext) => {
            if (nextRelease.version !== version) {
                throw new Error("The proposed release no longer matches the artifact version.");
            }
        },
        success: [], fail: []
    });
    if (!result || result.nextRelease.version !== version) {
        throw new Error("The approved version was not released.");
    }
}


if (process.argv.includes("--publish")) {
    await publish();
} else {
    await previewVersion();
}
