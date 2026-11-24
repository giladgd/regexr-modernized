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
import {app} from "../app";
import type {Token} from "../types";
import type {ExpressionHighlighter} from "./ExpressionHighlighter";



export class ExpressionHover {
    public editor: CodeMirror.Editor;
    public highlighter: ExpressionHighlighter;
    public isMouseDown: boolean;
    public token: Token | null;

    public constructor(editor: CodeMirror.Editor, highlighter: ExpressionHighlighter) {
        this.editor = editor;
        this.highlighter = highlighter;
        this.isMouseDown = false;
        this.token = null;

        const o = editor.getWrapperElement().querySelector<HTMLElement>(".CodeMirror-code")!;
        o.addEventListener("mousemove", (evt) => this._handleMouseMove(evt));
        o.addEventListener("mouseleave", (evt) => this._handleMouseOut(evt));
        o.addEventListener("mousedown", (evt) => this._handleMouseDown(evt));
    }

    // private methods:
    public _handleMouseMove(evt: MouseEvent) {
        if (this.isMouseDown) {
            return;
        }

        let index;
        const editor = this.editor;
        let token = this.token, target = null;

        if (evt && token && (index = CMUtils.getCharIndexAt(editor, evt.clientX, evt.clientY + window.pageYOffset)) != null) {
            while (token) {
                if (index >= token.i && index < token.i + token.l) {
                    target = token;
                    break;
                }
                token = token.next || null;
            }
        }

        while (target) {
            if (target.open) {
                target = target.open;
            } else if (target.proxy) {
                target = target.proxy;
            } else {
                break;
            }
        }

        this.highlighter.hoverToken = target;
        const rect = (index != null) && CMUtils.getCharRect(editor, index);

        app.tooltip.hover.show("ExpressionHover", app.reference.tipForToken(target), evt.clientX, (rect ? rect.bottom : evt.clientY), true, 0);
    }

    public _handleMouseOut(evt: MouseEvent) {
        this.highlighter.hoverToken = null;
        app.tooltip.hover.hide("ExpressionHover");
    }

    public _handleMouseDown(evt: MouseEvent) {
        // TODO: Should this also be in TextHover?
        if (evt.which !== 1 && evt.button !== 1) {
            return;
        }

        this.isMouseDown = true;
        let f: () => void;
        const t = window;
        t.addEventListener("mouseup", f = () => {
            t.removeEventListener("mouseup", f);
            this.isMouseDown = false;
        });
    }
}
