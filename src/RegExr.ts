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

import {EditorHistory} from "./helpers/EditorHistory";

import {EventDispatcher} from "./events/EventDispatcher";

import {DOMUtils as $} from "./utils/DOMUtils";

import {Tooltip} from "./controls/Tooltip";


import {Expression} from "./views/Expression";
import {Text} from "./views/Text";
import {Tools} from "./views/Tools";
import {Sidebar} from "./views/Sidebar";

import {Theme} from "./views/Theme";

import {Reference} from "./docs/Reference";
import {referenceContent} from "./docs/reference_content";
import {Flavor} from "./Flavor";

import {localizePage, prefs} from "./lang/language";
import {initLanguageMenu} from "./views/LanguageMenu";
import type {EditorState} from "./helpers/HistoryEntry";
import type {SolveResult, SolveRequest} from "./types";

export class RegExr extends EventDispatcher {
    public prefs = prefs;
    public flavor!: Flavor;
    public reference!: Reference;
    public theme!: Theme;
    public expression!: Expression;
    public text!: Text;
    public tools!: Tools;
    public sidebar!: Sidebar;
    public history!: EditorHistory;
    public el!: HTMLElement;
    public docEl!: HTMLElement;
    public tooltip!: {hover: Tooltip, toggle: Tooltip};
    public result!: SolveResult;
    public _matchList!: MediaQueryList;

    public async init() {
        localizePage();
        this.flavor = new Flavor();
        this.reference = new Reference(referenceContent, this.flavor);
        this._initUI();
        this.history = new EditorHistory(this);
        await this.history.start();
        initLanguageMenu(this.history);
        this.expression.editor.focus();
    }

    public get state(): EditorState {
        return {
            expression: this.expression.value, text: this.text.value, tests: structuredClone(this.text.tests),
            mode: this.text.mode, tool: this.tools.value.id, ...this.tools.buffers
        };
    }

    public set state(value: EditorState) {
        if (this.expression.value !== value.expression) {
            this.expression.value = value.expression;
        }
        if (this.text.value !== value.text) {
            this.text.value = value.text;
        }
        if (JSON.stringify(this.text.tests) !== JSON.stringify(value.tests)) {
            this.text.tests = structuredClone(value.tests);
        }
        this.text.mode = value.mode;
        this.tools.buffers = {replace: value.replace, list: value.list};
        this.tools.show(value.tool);
        if ((value.tool === "replace" || value.tool === "list") && this.tools.input !== value[value.tool]) {
            this.tools.editor.setValue(value[value.tool]);
        }
    }

    public get isNarrow() {
        return this._matchList.matches;
    }

    public _initUI() {
        this._matchList = window.matchMedia("(max-width: 900px)");
        this._matchList.addEventListener("change", () => this.dispatchEvent("narrow"));

        // UI:
        this.el = $.query(".container");

        this.tooltip = {
            hover: new Tooltip($.query("#library #tooltip").cloneNode(true) as HTMLElement),
            toggle: new Tooltip($.query("#library #tooltip"), true)
        };

        this.theme = new Theme(this.el, this.prefs, matchMedia("(prefers-color-scheme: dark)"));

        const el = this.docEl = $.query(".app > .doc", this.el);
        this.expression = new Expression($.query("section.expression", el));
        this.text = new Text($.query("section.text", el));
        this.tools = new Tools($.query("> section.tools", el));

        this.sidebar = new Sidebar($.query(".app > .sidebar", this.el), $.query(".header .sidebar-toggle", this.el));
        const observer = new ResizeObserver(() => {
            this.expression.editor.refresh();
            this.tools.editor.refresh();
        });
        observer.observe(this.docEl);

        this.expression.on("change", () => this._change());
        this.text.on("change", () => this._change());
        this.text.on("modechange", () => this._modeChange());
        this.flavor.on("change", () => this._change());
        this.tools.on("change", () => this._change());
        this.expression.editor.on("change", () => this.history?.edited());
    }

    public _change() {
        this.history?.edited();
        this.dispatchEvent("change");
        const solver = this.flavor.solver, exp = this.expression;
        const mode = this.text.mode;
        const o: SolveRequest = {pattern: exp.pattern, flags: exp.flags, ...(mode === "tests"
            ? {mode, tests: this.text.tests}
            : {mode, text: this.text.value, tool: this.tools.value})};
        solver.solve(o, (result) => this._handleResult(result));
    }

    public _modeChange() {
        $.toggleClass(this.docEl, "tests-mode", this.text.mode === "tests");
        this._change();
    }

    public _handleResult(result: SolveResult) {
        this.result = this._processResult(result);
        this.dispatchEvent("result");
    }

    public _processResult(result: SolveResult) {
        if (result.mode === "text") {
            result.matches?.forEach((o, i) => o.num = i);
        }
        return result;
    }
}
