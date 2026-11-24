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

import type {MenuNode} from "../types";

const deferIds: Record<string, ReturnType<typeof setTimeout>> = {};
export class Utils {
    public static prepMenuContent<T extends MenuNode>(content: T, idMap: Record<string, MenuNode>) {
        const kids = content.kids || [];
        let nextId = 1;
        for (let i = 0, l = kids.length; i < l; i++) {
            const o = kids[i];
            // current list implementation requires everything to have an id:
            if (!o.id) {
                while (idMap["__id_" + nextId]) {
                    nextId++;
                }
                o.id = "__id_" + nextId++;
            }
            idMap[o.id] = o;
            o.parent = content;
            if (o.kids) {
                Utils.prepMenuContent(o, idMap);
            }
        }
        return content;
    };

    public static copy = Object.assign;

    public static searchRank(o: MenuNode, search: string) {
        const test = Utils.searchTest;
        search = search.toLowerCase();
        return test(o.token, search, 16) + test((o.id || "") + " " + (o.label || ""), search, 8) + test((o.desc || "") + " " + (o.ext || ""), search, 4);
    }

    public static searchTest(str: string | undefined, search: string, weight = 1) {
        return (str && str.toLowerCase().indexOf(search) !== -1) ? weight : 0;
    }

    public static htmlSafe(str: string) {
        return str == null ? "" : ("" + str).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    };

    public static shorten(str = "", length: number, htmlSafe: boolean, tag = "") {
        if (!str) {
            return str;
        }
        const b = length > 0 && str.length > length;
        if (b) {
            str = str.substr(0, length - 1);
        }
        if (htmlSafe) {
            str = Utils.htmlSafe(str);
        }
        return !b ? str : str + (tag && "<" + tag + ">") + "\u2026" + (tag && "</" + tag + ">");
    };

    public static unescSubstStr(str: string) {
        if (!str) {
            return "";
        }
        return str.replace(Utils.SUBST_ESC_RE, (a: string, b: string, c: string) =>
            Utils.SUBST_ESC_CHARS[b] || String.fromCharCode(parseInt(c, 16)));
    };

    public static getRegExp(str: string) {
        // returns a JS RegExp object.
        const match = str.match(/^\/(.+)\/([a-z]+)?$/);
        let regex = null;
        try {
            regex = match ? new RegExp(match[1], match[2] || "") : new RegExp(str, "g");
        } catch (e) { }
        return regex;
    };

    public static decomposeRegEx(str: string, delim = "/") {
        const re = new RegExp("^" + delim + "(.*)" + delim + "([igmsuUxy]*)$");
        const match = re.exec(str);
        if (match) {
            return {source: match[1], flags: match[2]};
        } else {
            return {source: str, flags: "g"};
        }
    };

    public static isMac() {
        return !!(navigator.userAgent.match(/Mac\sOS/i));
    };

    public static defer(f: (() => void) | null, id: string, t = 1) {
        clearTimeout(deferIds[id]);
        if (f === null) {
            delete (deferIds[id]);
            return;
        }
        deferIds[id] = setTimeout(() => {
            delete deferIds[id];
            f();
        }, t);
    };

    public static SUBST_ESC_CHARS: Record<string, string> = {
        // this is just the list supported in Replace. Others: b, f, ", etc.
        n: "\n",
        r: "\r",
        t: "\t",
        "\\": "\\"
    };

    public static SUBST_ESC_RE = /\\([nrt\\]|u([A-Z0-9]{4}))/ig;
}
