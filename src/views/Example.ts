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

import {lang} from "../lang/language";
import {DOMUtils as $} from "../utils/DOMUtils";
import {Utils} from "../utils/Utils";
import {highlightRegex} from "../regexMode";

import {app} from "../app";

export class Example {
    public el: HTMLElement;
    public title: string;
    public _example?: string[];

    public constructor(title: string, ex: string[]) {
        this.el = $.create("div", "example");
        this.title = title;
        this.example = ex;
    }

    public set example(ex: string[]) {
        if (ex === this._example) {
            return;
        }
        this._example = ex;

        let str = "", txt = "", exp = "", regex;
        if (ex) {
            exp = ex[0];
            txt = ex[1];
            regex = Utils.getRegExp(exp);
            if (this.title) {
                str += "<h1>" + this.title + "</h1><hr>";
            }
            str += "<code class='expression'><button class='icon-button load'><svg class='icon' aria-hidden='true'><use href='#arrow-insert'></use></svg></button><span></span></code>";
            if (txt && regex) {
                const over = Math.max(0, txt.length - 160);
                let s = txt;
                if (over) {
                    s = Utils.htmlSafe(s.substr(0, 159));
                }
                if (regex) {
                    s = s.replace(regex, "<em>$&</em>");
                }
                // TODO: this won't match on html elements:
                str += "<hr><code class='text'><button class='icon-button load'><svg class='icon' aria-hidden='true'><use href='#arrow-insert'></use></svg></button>" + s + (over ? "<i>\u2026</i>" : "") + "</code>";
            }
        }
        this.el.innerHTML = str;
        this.el.querySelector("code.expression .load")?.setAttribute("aria-label", lang.loadExpression);
        this.el.querySelector("code.text .load")?.setAttribute("aria-label", lang.loadText);
        if (exp) {
            highlightRegex($.query("code.expression > span", this.el), exp);
            $.query("code.expression > .load", this.el).addEventListener("click", () => {
                // TODO: this will need to be updated when we support other delimiters:
                app.expression.value = exp[0] === "/" ? exp : "/" + exp + "/g";
            });
        }
        if (txt) {
            $.query("code.text > .load", this.el).addEventListener("click", () => app.text.value = txt);
        }
    }
}
