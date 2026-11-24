export type Mode = "text" | "tests";
export type ToolId = "replace" | "list" | "explain" | "details";
export type Tool = {id: ToolId, input: string | null};
export type TestCase = {id: string, name: string, text: string, type: "any" | "all" | "none" | "start"};
export type Pattern = {
    id?: string,
    expression: string,
    text: string,
    mode: Mode,
    tests: TestCase[],
    tool: Tool,
    name: string,
    author: string,
    description: string,
    keywords: string
};
export type SavedPattern = Pattern & {id: string};

export type RegexError = {id: string, warning?: boolean, name?: string, message?: string};
export type Group = {s?: string};
export type Match = {
    i: number, l: number, num?: number, id?: string, groups?: Group[],
    startPos?: import("codemirror").Position, endPos?: import("codemirror").Position
};
export type SolveRequest = {pattern: string, flags: string} & (
    {mode: "text", text: string, tool: Tool} | {mode: "tests", tests: TestCase[]}
);
export type SolveResult = {
    mode: Mode, matches: Match[], error?: RegexError, time: number | null,
    tool?: {id: ToolId, result?: string}
};

export type Token = {
    startPos?: import("codemirror").Position, endPos?: import("codemirror").Position, clear?: boolean,
    i: number, l: number, type: string, clss?: string, prev?: Token | null, prv?: Token | null,
    next?: Token, close?: Token | null, open?: Token, group?: Token | true, related?: Token[],
    proxy?: Token, set?: Token[], alt?: Token, condition?: Token, modes?: Record<string, boolean>,
    error?: RegexError, code?: number, min?: number, max?: number, name?: string, num?: number,
    depth?: number, dir?: number, curGroupNum?: number, inGroupNum?: number, relIndex?: number,
    behind?: boolean, negative?: boolean, ignore?: boolean, capture?: boolean, subst?: boolean,
    value?: string | null, on?: string, off?: string, errmode?: string
};

export type MenuNode = {
    id?: string, label?: string, desc?: string, ext?: string, tip?: string, tooltip?: string,
    token?: string, proxy?: string, el?: string, example?: string[], target?: string,
    list?: boolean, hide?: boolean, show?: boolean, search?: boolean, selected?: boolean,
    parent?: MenuNode, kids?: MenuNode[], __searchPoints?: number
};
export type ReferenceContent = MenuNode & {
    kids: MenuNode[], misc: MenuNode & {kids: MenuNode[]}, errors: Record<string, string>
};
