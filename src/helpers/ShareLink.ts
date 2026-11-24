import {UID} from "../utils/UID";
import type {EditorState} from "./HistoryEntry";
import type {TestCase} from "../types";

type Snapshot = EditorState & {name: string};

const testParams = {all: "testMatchFull", any: "test", none: "textMatchNon", start: "testMatchStart"} as const;

export function shareQuery(snapshot: Snapshot, defaults: EditorState) {
    const params = new URLSearchParams({expression: snapshot.expression});
    if (snapshot.name) {
        params.set("name", snapshot.name);
    }
    if (snapshot.text !== defaults.text) {
        params.set("text", snapshot.text);
    }
    for (const test of snapshot.tests) {
        params.append(testParams[test.type], test.text);
        if (test.name) {
            params.append("testTitle", test.name);
        }
    }
    for (const tool of ["list", "replace"] as const) {
        if (snapshot[tool] !== defaults[tool]) {
            params.set(tool, snapshot[tool]);
        }
    }
    if (snapshot.mode === "tests") {
        params.set("focus", "test");
    } else if (snapshot.tool !== "explain") {
        params.set("focus", snapshot.tool === "details" ? "text" : snapshot.tool);
    }
    return params;
}

export function readQuery(params: URLSearchParams, base: EditorState): Snapshot {
    const state = {...base, name: params.get("name") ?? ""};
    const tool = params.get("tool");
    if (tool === "replace" || tool === "list" || tool === "explain" || tool === "details") {
        state.tool = tool;
        if (tool === "replace" || tool === "list") {
            state[tool] = params.get("input") ?? state[tool];
        }
    }
    for (const field of ["expression", "text", "list", "replace"] as const) {
        state[field] = params.get(field) ?? state[field];
    }
    const focus = params.get("focus");
    if (focus === "test" || focus === "text" || focus === "replace" || focus === "list") {
        state.mode = focus === "test" ? "tests" : "text";
        state.tool = focus === "list" || focus === "replace" ? focus : "explain";
    }

    const tests: TestCase[] = [];
    let previous: TestCase | undefined;
    for (const [param, value] of params) {
        if (param === "testTitle" && previous) {
            previous.name = value;
        }
        const type = param === "testMatchNone" ? "none" :
            (["all", "any", "none", "start"] as const).find((type) => testParams[type] === param);
        previous = type ? {id: UID.id, name: "", text: value, type} : undefined;
        if (previous) {
            tests.push(previous);
        }
    }
    if (tests.length) {
        state.tests = tests;
    }
    return state;
}

export function readFragment(fragment: string): Snapshot {
    if (!/^#share=1\.[\w-]+$/.test(fragment)) {
        throw new Error("Invalid share link");
    }
    const binary = atob(fragment.slice(9).replaceAll("-", "+")
        .replaceAll("_", "/"));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const data = JSON.parse(new TextDecoder("utf-8", {fatal: true}).decode(bytes));
    const validTest = (test: Partial<TestCase> | null) => test && typeof test.id === "string" && !!test.id &&
        typeof test.name === "string" && typeof test.text === "string" &&
        ["any", "none", "all", "start"].includes(test.type ?? "");
    if (!data || typeof data.expression !== "string" || typeof data.text !== "string" ||
        typeof data.replace !== "string" || typeof data.list !== "string" ||
        (data.name !== undefined && typeof data.name !== "string") ||
        !["text", "tests"].includes(data.mode) || !["replace", "list", "details", "explain"].includes(data.tool) ||
        !Array.isArray(data.tests) || !data.tests.every(validTest)) {
        throw new Error("Invalid share fields");
    }
    const tests: TestCase[] = data.tests.map(({id, name, text, type}: TestCase) => ({id, name, text, type}));
    if (new Set(tests.map((test) => test.id)).size !== tests.length) {
        throw new Error("Duplicate test ID");
    }
    const {expression, text, mode, tool, replace, list, name = ""} = data;
    return {expression, text, mode, tool, replace, list, name, tests};
}
