/*
RegExr: Learn, Build, & Test RegEx
Copyright (C) 2017  gskinner.com, inc.
Modifications (C) 2026 Gilad S.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import CodeMirror from "codemirror";

/*
Utilities for working with CodeMirror.
*/

import {Utils} from "../utils/Utils";
import {DOMUtils as $} from "../utils/DOMUtils";

type Options = CodeMirror.EditorConfiguration & {singleLine?: boolean, maxLength?: number};
export class CMUtils {
    public static create(target: HTMLElement, opts: Options = {}, width = "100%", height = "100%") {
        const keys = {};
        // keys[ctrlKey + "-Z"] = keys[ctrlKey + "-Y"] = keys["Shift-" + ctrlKey + "-Z"] = () => false; // block CM handling

        const o = Utils.copy({
            lineNumbers: false,
            tabSize: 3,
            indentWithTabs: true,
            extraKeys: keys,
            specialChars: /[ \u0000-\u001f\u007f-\u009f\u00ad\u061c\u200b-\u200f\u2028\u2029\ufeff]/,
            specialCharPlaceholder: (ch: string) => $.create("span", ch === " " ? "cm-space" : "cm-special", " ") // needs to be a space so wrapping works
        }, opts);

        const cm = CodeMirror(target, o);
        cm.setSize(width, height);

        if (opts.maxLength) {
            cm.on("beforeChange", (editor, change) => CMUtils.enforceMaxLength(editor, change, opts.maxLength!));
        }
        if (opts.singleLine) {
            cm.on("beforeChange", CMUtils.enforceSingleLine);
        }

        return cm;
    };

    public static refreshScrollbars(cm: CodeMirror.Editor) {
        // CodeMirror 5 caches the scrollbar width and overlay hit targets separately.
        (cm as CodeMirror.Editor & {display: {scrollbarsClipped: boolean}}).display.scrollbarsClipped = false;
        cm.setOption("scrollbarStyle", "null");
        cm.refresh();
        cm.setOption("scrollbarStyle", "native");
    }

    public static getCharIndexAt(cm: CodeMirror.Editor, winX: number, winY: number) {
        const pos = cm.coordsChar({left: winX, top: winY}, "page");
        // test current and prev character, since CM seems to use the center of each character for coordsChar:
        for (let i = 0; i <= 1; i++) {
            const rect = cm.charCoords(pos, "page");
            if (winX >= rect.left && winX <= rect.right && winY >= rect.top && winY <= rect.bottom) {
                return cm.indexFromPos(pos);
            }
            if (pos.ch-- <= 0) {
                break;
            }
        }
        return null;
    };

    public static getCharRect(cm: CodeMirror.Editor, index: number) {
        const pos = cm.posFromIndex(index), rect = cm.charCoords(pos);
        return new DOMRect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);
    };

    public static enforceMaxLength(cm: CodeMirror.Editor, change: CodeMirror.EditorChangeCancellable, maxLength: number) {
        if (maxLength && change.update) {
            let str = change.text.join("\n");
            let delta = str.length - (cm.indexFromPos(change.to) - cm.indexFromPos(change.from));
            if (delta <= 0) {
                return true;
            }
            delta = cm.getValue().length + delta - maxLength;
            if (delta > 0) {
                str = str.substr(0, str.length - delta);
                change.update(change.from, change.to, str.split("\n"));
            }
        }
        return true;
    };

    public static enforceSingleLine(cm: CodeMirror.Editor, change: CodeMirror.EditorChangeCancellable) {
        if (change.update) {
            const str = change.text.join("").replace(/(\n|\r)/g, "");
            change.update(change.from, change.to, [str]);
        }
        return true;
    };

    public static selectAll(cm: CodeMirror.Editor) {
        cm.focus();
        cm.setSelection({ch: 0, line: 0}, {ch: 0, line: cm.lineCount()});
    }

    public static calcRangePos(cm: CodeMirror.Editor, i: number, l = 0,
        o: {startPos?: CodeMirror.Position, endPos?: CodeMirror.Position} = {}) {
        const doc = cm.getDoc();
        return Object.assign(o, {startPos: doc.posFromIndex(i), endPos: doc.posFromIndex(i + l)});
    }
}
