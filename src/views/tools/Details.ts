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
import {format, lang} from "../../lang/language";


import {DOMUtils as $} from "../../utils/DOMUtils";
import {Utils} from "../../utils/Utils";

import {app} from "../../app";
import type {Match} from "../../types";
import type {Event as AppEvent} from "../../events/Event";

export class Details {
    public el: HTMLElement;
    public _boundHandleEvent: (evt: AppEvent) => void;

    public constructor(el: HTMLElement) {
        this.el = el;
        $.addClass(el, "details");
        this._update();

        this._boundHandleEvent = (evt) => this._handleEvent(evt);
        app.addEventListener("result", this._boundHandleEvent);
        app.text.addEventListener("select", this._boundHandleEvent);
    }

    public cleanup() {
        $.empty(this.el);
        $.removeClass(this.el, "details");
        app.removeEventListener("result", this._boundHandleEvent);
        app.text.removeEventListener("select", this._boundHandleEvent);
        Utils.defer(null, "Details._update");
    }

    // private methods:
    public _update() {
        $.empty(this.el);
        $.create("div", "desc", lang.detailsHint, this.el);
        this._addMatch(app.text.selectedMatch, app.text.value);
    }

    public _addMatch(match: Match | null, textVal: string) {
        if (!match) {
            return;
        }
        const groups = match.groups || [], groupTokens = app.expression.lexer.captureGroups;
        const tableEl = $.create("table", null, null, this.el);
        const matchEl = $.create("tr", "match", "<td>" + format(lang.matchNumber, {number: match.num ?? 0}) + "</td><td>" + match.i + "-" + (match.i + match.l - 1) + "</td><td></td>", tableEl);
        $.query("td:last-child", matchEl).innerHTML = this._getMatchVal(textVal.substr(match.i, match.l));
        groups.forEach((group, i) => {
            const token = groupTokens[i], label = token?.name ? "'" + token.name + "'" : format(lang.groupNumber, {number: i + 1});
            const tr = $.create("tr", "group", "<td>" + Utils.htmlSafe(label) + "</td><td>" + lang.notAvailable + "</td><td><span>" + this._getMatchVal(group.s) + "</span></td>", tableEl);
            tr.onmouseover = () => app.expression.highlighter.hoverToken = token || null;
            tr.onmouseout = () => app.expression.highlighter.hoverToken = null;
        });
        if (!groups.length) {
            $.create("tr", "nogroup", lang.noGroups, tableEl);
        }
    }

    public _getMatchVal(val?: string) {
        return val ? Utils.htmlSafe(val) : lang.emptyMatch;
    }

    public _handleEvent(evt: AppEvent) {
        Utils.defer(() => this._update(), "Details._update");
    }
}
