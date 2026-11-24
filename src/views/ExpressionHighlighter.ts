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

import {EventDispatcher} from "../events/EventDispatcher";
import {CMUtils} from "../utils/CMUtils";
import type {Token} from "../types";

export class ExpressionHighlighter extends EventDispatcher {
    public cm: CodeMirror.Editor;
    public _activeMarks: CodeMirror.TextMarker[];
    public _hoverMarks: CodeMirror.TextMarker[];
    public _hoverToken: Token | null;

    public constructor(cm: CodeMirror.Editor) {
        super();
        this.cm = cm;
        this._activeMarks = [];
        this._hoverMarks = [];
        this._hoverToken = null;
    }

    public clear() {
        this.cm.operation(() => {
            const marks = this._activeMarks;
            for (let i = 0, l = marks.length; i < l; i++) {
                marks[i].clear();
            }
            marks.length = 0;
        });
    }

    public draw(token: Token | null | undefined) {
        const cm = this.cm, pre = ExpressionHighlighter.CSS_PREFIX;

        this.clear();
        cm.operation(() => {
            const doc = cm.getDoc(), marks = this._activeMarks;

            while (token) {
                if (token.clear) {
                    token = token.next;
                    continue;
                }
                token = this._calcTokenPos(token);

                let className = pre + (token.clss || token.type);
                if (token.error) {
                    className += " " + pre + (token.error.warning ? "warning" : "error");
                }

                if (className) {
                    marks.push(doc.markText(token.startPos!, token.endPos!, {className: className}));
                }

                token = token.next;
            }
        });
    }

    public set hoverToken(token: Token | null) {
        if (token === this._hoverToken) {
            return;
        }
        if (token && token.set && this._hoverToken && token.set.indexOf(this._hoverToken) !== -1) {
            return;
        }
        while (this._hoverMarks.length) {
            this._hoverMarks.pop()!.clear();
        }

        this._hoverToken = token;
        if (token) {
            if (token.open) {
                this._drawSelect(token.open);
            } else {
                this._drawSelect(token);
            }
            if (token.related) {
                for (let i = 0, l = token.related.length; i < l; i++) {
                    this._drawSelect(token.related[i], ExpressionHighlighter.CSS_PREFIX + "related");
                }
            }
        }

        this.dispatchEvent("hover");
    };

    public get hoverToken() {
        return this._hoverToken;
    }

    // private methods:
    public _drawSelect(token: Token, style = ExpressionHighlighter.CSS_PREFIX + "selected") {
        const doc = this.cm.getDoc();
        let endToken = token.close || token;
        if (token.set) {
            endToken = token.set[token.set.length - 1];
            token = token.set[0];
        }

        this._calcTokenPos(endToken);
        this._calcTokenPos(token);
        this._hoverMarks.push(doc.markText(token.startPos!, endToken.endPos!, {
            className: style,
            startStyle: style + "-left",
            endStyle: style + "-right"
        }));
    };

    public _calcTokenPos(token: Token) {
        if (token.startPos || token == null) {
            return token;
        }
        CMUtils.calcRangePos(this.cm, token.i, token.l, token);
        return token;
    };

    public static CSS_PREFIX = "exp-";
    public static GROUP_CLASS_BY_TYPE: Record<string, string> = {
        set: ExpressionHighlighter.CSS_PREFIX + "group-set",
        setnot: ExpressionHighlighter.CSS_PREFIX + "group-set",
        group: ExpressionHighlighter.CSS_PREFIX + "group-%depth%",
        lookaround: ExpressionHighlighter.CSS_PREFIX + "group-%depth%"
    };
};
