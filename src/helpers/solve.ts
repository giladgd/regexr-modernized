import {Utils} from "../utils/Utils";
import type {Match, SolveRequest, SolveResult} from "../types";

export function solve(request: SolveRequest): SolveResult {
    const start = performance.now();
    const matches: Match[] = [];
    const result: SolveResult = {mode: request.mode, matches, time: null};
    let regex;
    try {
        regex = new RegExp(request.pattern, request.flags);
    } catch (error) {
        result.error = {id: "regexparse", message: error instanceof Error ? error.message : String(error)};
        return result;
    }
    if (request.mode === "tests") {
        for (const test of request.tests) {
            regex.lastIndex = 0;
            const match = regex.exec(test.text);
            matches.push({id: test.id, i: match?.index ?? -1, l: match?.[0].length ?? 0});
        }
    } else {
        let match;
        while ((match = regex.exec(request.text))) {
            matches.push({i: match.index, l: match[0].length, num: matches.length, groups: match.slice(1).map((s) => ({s}))});
            if (!regex.global) {
                break;
            }
            if (!match[0].length) {
                result.error = {id: "infinite", warning: true};
                const cp = request.text.codePointAt(regex.lastIndex);
                regex.lastIndex += regex.unicode && cp !== undefined && cp > 0xffff ? 2 : 1;
            }
        }
        const tool = request.tool;
        if (tool.id === "replace" || tool.id === "list") {
            const str = Utils.unescSubstStr(tool.input || "");
            result.tool = {id: tool.id, result: tool.id === "replace" ? request.text.replace(regex, str) : getList(request.text, request.pattern, request.flags, str)};
        }
    }
    result.time = result.error ? null : performance.now() - start;
    return result;
}

function getList(source: string, pattern: string, flags: string, str: string) {
    let result = "", repl, ref, trimR = 0, regex;

    // build a RegExp without the global flag:
    try {
        regex = new RegExp(pattern, flags.replace("g", ""));
    } catch (e) {
        return "";
    }

    if (str.search(/\$[&1-9`']/) === -1) {
        trimR = str.length;
        str = "$&" + str;
    }
    do {
        ref = source.replace(regex, "\b"); // bell char - just a placeholder to find
        const index = ref.indexOf("\b"), empty = (ref.length > source.length);
        if (index === -1) {
            break;
        }
        repl = source.replace(regex, str);
        result += repl.substr(index, repl.length - ref.length + 1);
        source = ref.substr(index + (empty ? 2 : 1));
    } while (source.length);
    if (trimR) {
        result = result.substr(0, result.length - trimR);
    }
    return result;
}
