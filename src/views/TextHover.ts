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

import {CMUtils} from "../utils/CMUtils";
import {DOMUtils as $} from "../utils/DOMUtils";

import {app} from "../app";
import type {TextHighlighter} from "./TextHighlighter";
import type {Match} from "../types";

export class TextHover {
    public editor: CodeMirror.Editor;
    public highlighter: TextHighlighter;
    public _matches?: Match[];
    public _x: number | null;
    public _y = 0;

    public constructor(editor: CodeMirror.Editor, highlighter: TextHighlighter) {
        this.editor = editor;
        this.highlighter = highlighter;
        this._x = null;

        const o = editor.getWrapperElement().querySelector<HTMLElement>(".CodeMirror-code")!;
        o.addEventListener("mousemove", (evt) => this._handleMouseMove(evt));
        o.addEventListener("mouseout", (evt) => this._handleMouseOut(evt));
    }

    public set matches(val: Match[] | undefined) {
        this._matches = val;
        this._update();
    }

    // private methods:
    public _handleMouseMove(evt: MouseEvent) {
        this._x = evt.clientX;
        this._y = evt.clientY + window.pageYOffset;
        this._update();
    }

    public _handleMouseOut(evt: MouseEvent) {
        this._x = null;
        this._update();
    }

    public _update() {
        if (this._x === null) {
            this.highlighter.hoverMatch = null;
            app.tooltip.hover.hide("TextHover");
            return;
        }
        let index;
        const cm = this.editor;
        let match;
        const matches = this._matches, x = this._x, y = this._y;

        if (matches && matches.length && (index = CMUtils.getCharIndexAt(cm, x, y)) != null) {
            match = this.highlighter.hoverMatch = app.text.getMatchAt(index);
        }
        const rect = (index != null) && CMUtils.getCharRect(cm, index);

        const tip = app.reference.tipForMatch(match, cm.getValue());
        if (tip && rect) {
            const div = $.create("div", "texthover", tip);
            app.tooltip.hover.show("TextHover", div, x, rect.bottom, true, 0);
        }
    }
}
