import type {Mode, ToolId, TestCase, SavedPattern} from "../types";

export type EditorState = {
    expression: string, text: string, tests: TestCase[], mode: Mode, tool: ToolId,
    replace: string, list: string
};
export type HistoryEntry = EditorState & {
    id: string, name: string, pinned: boolean, modifiedAt: number
};
export type EntryChanges = Partial<Omit<HistoryEntry, "id" | "modifiedAt">>;

export const toolDefaults = {replace: "<< $& >>", list: "$&\\n"};

export function migratePattern(old: SavedPattern): HistoryEntry {
    const {tool, ...fields} = old;
    const buffers = {...toolDefaults};
    if (tool.input !== null && (tool.id === "replace" || tool.id === "list")) {
        buffers[tool.id] = tool.input;
    }
    return {...fields, ...buffers, tool: tool.id, pinned: false, modifiedAt: 0};
}

export function differences(before: EditorState, after: EditorState): Partial<EditorState> {
    const changes: Partial<EditorState> = {};
    if (before.expression !== after.expression) {
        changes.expression = after.expression;
    }
    if (before.text !== after.text) {
        changes.text = after.text;
    }
    if (before.mode !== after.mode) {
        changes.mode = after.mode;
    }
    if (before.tool !== after.tool) {
        changes.tool = after.tool;
    }
    if (before.replace !== after.replace) {
        changes.replace = after.replace;
    }
    if (before.list !== after.list) {
        changes.list = after.list;
    }
    if (JSON.stringify(before.tests) !== JSON.stringify(after.tests)) {
        changes.tests = structuredClone(after.tests);
    }
    return changes;
}

export function mergeEntry(entry: HistoryEntry, changes: EntryChanges, now = Date.now()): HistoryEntry {
    if (changes.pinned !== undefined && Object.keys(changes).length === 1) {
        return {...entry, pinned: changes.pinned};
    }
    return {...entry, ...changes, modifiedAt: Math.max(now, entry.modifiedAt + 1)};
}
