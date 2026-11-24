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
import {lang} from "../../lang/language";
import {DOMUtils as $} from "../../utils/DOMUtils";

import {ExpressionHighlighter} from "../ExpressionHighlighter";
import {regexSpan} from "../../regexMode";

import {app} from "../../app";
import type {Event as AppEvent} from "../../events/Event";
import type {Token} from "../../types";

type TokenDiv = HTMLElement & {token?: Token, proxy?: HTMLElement};

export class Explain {
    public el: HTMLElement;
    public _boundHandleEvent: (evt: AppEvent) => void;
    public _divs: TokenDiv[] = [];

    public constructor(el: HTMLElement) {
        this.el = el;
        $.addClass(el, "explain");
        this._update();

        this._boundHandleEvent = (evt) => this._handleEvent(evt);
        app.expression.addEventListener("change", this._boundHandleEvent);
        app.expression.highlighter.addEventListener("hover", this._boundHandleEvent);
    }

    public cleanup() {
        $.empty(this.el);
        $.removeClass(this.el, "explain");
        app.expression.removeEventListener("change", this._boundHandleEvent);
        app.expression.highlighter.removeEventListener("hover", this._boundHandleEvent);
    }

    // private methods:
    public _update() {
        let el = $.empty(this.el), token = app.expression.token;
        const expr = app.expression.value;
        this._divs = [];
        if (!token || token.next?.type === "close") {
            el.innerHTML = lang.explainEmpty;
            return;
        }
        const syntax = app.expression.editor.getLineTokens(0);
        let syntaxIndex = 0;
        el.innerHTML = lang.explainHint;
        while ((token = token.next || null) && (token.type !== "close")) {
            if (token.proxy || (token.open && token.open.proxy)) {
                continue;
            }

            const first = token.set?.[0] ?? token, last = token.set?.[2] ?? token;
            const start = first.i, end = last.i + last.l;
            const code = document.createElement("code");
            code.className = "token";
            while (syntaxIndex < syntax.length && syntax[syntaxIndex].end <= start) {
                syntaxIndex++;
            }
            for (let i = syntaxIndex; i < syntax.length && syntax[i].start < end; i++) {
                const part = syntax[i];
                code.append(regexSpan(expr.slice(Math.max(start, part.start), Math.min(end, part.end)), part.type));
            }
            const div: TokenDiv = $.create("div", null, token.open ? "&nbsp;" : app.reference.tipForToken(token), el);
            div.prepend(code, " ");

            if (token.close) {
                let className = ExpressionHighlighter.GROUP_CLASS_BY_TYPE[token.clss || token.type];
                if (className) {
                    className = className.replace("%depth%", String(Math.min(4, token.depth || 0)));
                    $.addClass(div, className);
                }
                if (token.depth && token.depth > 3) {
                    div.innerHTML = lang.nestedGroups;
                    token = token.close.prv!;
                    this._divs.push(div);
                    el = div;
                    continue;
                }
                el = div;
            }

            div.token = token;

            if (token.open) {
                $.addClass(div, "close");
                div.proxy = el;
                el = el.parentElement!;
            }

            if (token.error) {
                $.addClass(div, "error");
                if (token.error.warning) {
                    $.addClass(div, "warning");
                }
            }

            if (!token.open) {
                div.addEventListener("mouseover", this._handleMouseEvent);
                div.addEventListener("mouseout", this._handleMouseEvent);
                div.addEventListener("click", this._handleMouseEvent);
            }

            if (token.clss === "quant" || token.type === "lazy" || token.type === "possessive") {
                this._insertApplied(div);
            } else {
                this._divs.push(div);
            }
        }
    }

    public _insertApplied(div: TokenDiv) {
        const divs = this._divs, prv = div.token?.prv;
        let i = divs.length - 1;
        while (i >= 0 && divs[i].token !== prv) {
            i--;
        }
        if (i < 0) {
            divs.push(div);
            return;
        }
        const d = divs[i].proxy || divs[i];
        divs.splice(i, 0, div);
        d.insertAdjacentElement("afterend", div);
        $.addClass(div, "applied");
    }

    public _handleHoverChange() {
        const token = app.expression.highlighter.hoverToken;
        $.removeClass($.queryAll("div.selected", this.el), "selected");
        $.removeClass($.queryAll("div.related", this.el), "related");
        if (!token) {
            return;
        }

        const div = this._findDiv(token);
        $.addClass(div, "selected");
        if (token.related) {
            for (let i = 0, l = token.related.length; i < l; i++) {
                $.addClass(this._findDiv(token.related[i]), "related");
            }
        }
    }

    public _findDiv(token: Token) {
        return this._divs.find((div) => div.token === token) || null;
    }

    public _handleMouseEvent(evt: Event) {
        const type = evt.type, token = (evt.currentTarget as TokenDiv).token!;
        if (type == "click") {
            app.sidebar.showToken(token);
        } else {
            app.expression.highlighter.hoverToken = type === "mouseout" ? null : token;
        }
        evt.stopPropagation();
    }

    public _handleEvent(evt: AppEvent) {
        if (evt.type === "change") {
            this._update();
        } else if (evt.type === "hover") {
            this._handleHoverChange();
        }
    }
}
