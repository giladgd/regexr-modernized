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
import {CMUtils} from "../utils/CMUtils";
import {toolDefaults} from "../helpers/HistoryEntry";

import {List} from "../controls/List";
import {SubstLexer} from "../SubstLexer";
import {EventDispatcher} from "../events/EventDispatcher";
import {app} from "../app";
import {ExpressionHighlighter} from "./ExpressionHighlighter";
import {ExpressionHover} from "./ExpressionHover";
import {Explain} from "./tools/Explain";
import {Details} from "./tools/Details";
import {Replace} from "./tools/Replace";


import type {Tool, ToolId} from "../types";

export class Tools extends EventDispatcher {
    public el: HTMLElement;
    public headerEl!: HTMLElement;
    public contentEl!: HTMLElement;
    public resultEl!: HTMLElement;
    public toolListEl!: HTMLElement;
    public toolList!: List<{id: ToolId, label: string}>;
    public editor!: CodeMirror.Editor;
    public lexer!: SubstLexer;
    public highlighter!: ExpressionHighlighter;
    public hover!: ExpressionHover;
    public _toolId!: ToolId;
    public _tool?: Explain | Details | Replace;
    public buffers = {...toolDefaults};

    public constructor(el: HTMLElement) {
        super();
        this.el = el;
        this._initUI();
        this.value = null;
    }

    public set value(o: Tool | null | undefined) {
        if (!o) {
            this.show("explain");
            this.buffers = {...toolDefaults};
        } else {
            this.show(o.id);
            if (o.input != null) {
                this.editor.setValue(o.input);
            }
        }
    }

    public get value(): Tool {
        return {
            id: this._toolId,
            input: this.input
        };
    }

    public get input() {
        return this.hasInput ? this.editor.getValue() : null;
    }

    public get hasInput() {
        const id = this._toolId;
        return (id === "replace" || id === "list");
    }

    public show(id: ToolId, focus = false) {
        if (!id || id === this._toolId) {
            return;
        }

        this.toolList.selected = this._toolId = id;
        const input = (id === "replace" || id === "list");

        if (this._tool) {
            this._tool.cleanup();
        }

        $.toggleClass($.query("> article", this.el), "showinput", input);
        if (input) {
            this.editor.setValue(this.buffers[id]);
            this.editor.refresh();
            if (focus) {
                this.editor.focus();
            }
        }

        if (id === "explain") {
            this._tool = new Explain(this.contentEl);
        } else if (id === "details") {
            this._tool = new Details(this.contentEl);
        } else if (id === "replace" || id === "list") {
            this._tool = new Replace(this.resultEl, this.editor);
        }

        this._toolId = id;
        this._updateHighlights();
    }

    public _initUI() {
        const el = this.el;
        this.headerEl = $.query("header", this.el);
        this.headerEl.addEventListener("click", (evt) => this._handleHeaderClick(evt), {capture: true});

        this.contentEl = $.query("> article > .content", el);
        this.resultEl = $.query("> article > .inputtool > .result", el);

        this.toolListEl = $.query(".toollist", this.headerEl);
        const data = (["replace", "list", "details", "explain"] as const).map((id) => ({id, label: lang[id]}));
        this.toolList = new List(this.toolListEl, {data});
        this.toolList.on("change", () => this._handleListChange());

        const editor = this.editor = CMUtils.create($.query(".inputtool .editor", el), {
            maxLength: 2500,
            singleLine: true
        }, "100%", "100%");

        $.query("button.help", el).addEventListener("click", () => app.sidebar.goto(this._toolId));

        // TODO: evaluate this living here or in Replace:
        editor.on("change", () => this._handleEditorChange());

        app.flavor.on("change", () => this._updateHighlights());
        app.expression.on("change", () => this._updateHighlights());

        this.lexer = new SubstLexer();
        this.highlighter = new ExpressionHighlighter(editor);
        this.hover = new ExpressionHover(editor, this.highlighter);
    }

    public _handleEditorChange() {
        this._updateHighlights();
        if (this._toolId === "replace" || this._toolId === "list") {
            this.buffers[this._toolId] = this.editor.getValue();
        }
        this.dispatchEvent("change");
    }

    public _updateHighlights() {
        if (!this.hasInput) {
            return;
        } // only for Replace & List
        this.lexer.profile = app.flavor.profile;
        const token = this.lexer.parse(this.editor.getValue());
        this.highlighter.draw(token);
        this.hover.token = token;
    }

    public _handleListChange() {
        this.show(this.toolList.selected as ToolId, true);
        this.dispatchEvent("change");
    }

    public _handleHeaderClick(evt: MouseEvent) {
        if ($.hasClass(this.el, "closed") || !this.toolListEl.contains(evt.target as Node)) {
            const closed = this.el.classList.toggle("closed");
            const button = $.query("button.max", this.headerEl);
            const article = $.query("> article", this.el);
            if (closed && article.contains(document.activeElement)) {
                button.focus({preventScroll: true});
            }
            article.inert = closed;
            button.setAttribute("aria-expanded", String(!closed));
            button.setAttribute("aria-label", closed ? lang.expandTools : lang.collapseTools);
            if (!closed) {
                this.editor.refresh();
            }
        }
    }
}
