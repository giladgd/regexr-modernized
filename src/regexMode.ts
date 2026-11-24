import CodeMirror from "codemirror";
import "codemirror/addon/mode/simple";
import "codemirror/addon/runmode/runmode";

export const regexMode = "typescript-regexp";

const literal = "regex-literal", constant = "regex-constant", keyword = "regex-keyword", name = "regex-name";
const encoded = /\\(?:[0-7]{3}|x[\da-fA-F]{2}|u[\da-fA-F]{4}|c[A-Z])/;
const escapes = [
    {regex: encoded, token: constant},
    {regex: /\\[wWsSdDtrnvf]/, token: constant},
    {regex: /\\./, token: literal}
];
const beforeRange = /(?=-(?:[^\]\\]|\\.))/.source;

CodeMirror.defineSimpleMode(regexMode, {
    start: [
        {regex: /(\(\?<)([a-zA-Z_$][\w$]*)(>)/, token: [literal, name, literal]},
        {regex: /(\\k<)([a-zA-Z_$][\w$]*)(>)/, token: [keyword, name, keyword]},
        {regex: /\\[1-9]\d*|\\[bB]|[\^$]/, token: keyword},
        {regex: /(\[)(\^)/, token: [constant, literal], next: "set"},
        {regex: /\[/, token: constant, next: "set"},
        {regex: /\./, token: constant},
        ...escapes,
        {regex: /(\/)([dgimsuvy]+)$/, token: [literal, keyword]},
        {regex: /[^\\[(/.^$]+|./, token: literal}
    ],
    set: [
        {regex: /\]/, token: constant, next: "start"},
        {regex: new RegExp("(?:.|" + encoded.source + ")" + beforeRange), token: constant, next: "range"},
        {regex: new RegExp(/\\./.source + beforeRange), token: literal, next: "range"},
        ...escapes,
        {regex: /./, token: constant}
    ],
    range: [
        {regex: new RegExp("-" + encoded.source), token: constant, next: "set"},
        {regex: /(-)(\\.)/, token: [constant, literal], next: "set"},
        {regex: /-./, token: constant, next: "set"}
    ]
});

export function regexSpan(text: string, style?: string | null) {
    const span = document.createElement("span");
    if (style) {
        span.className = "cm-" + style;
    }
    span.textContent = text;
    return span;
}

export function highlightRegex(code: HTMLElement, expression: string) {
    code.replaceChildren();
    CodeMirror.runMode(expression, regexMode, (text, style) => code.append(regexSpan(text, style)));
}
