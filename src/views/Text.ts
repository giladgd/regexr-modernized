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
import {format, lang} from "../lang/language";

import {DOMUtils as $} from "../utils/DOMUtils";
import {Utils} from "../utils/Utils";
import {UID} from "../utils/UID";
import {CMUtils} from "../utils/CMUtils";
import {EventDispatcher} from "../events/EventDispatcher";
import {List} from "../controls/List";

import {app} from "../app";
import {TextHover} from "./TextHover";
import {TextHighlighter} from "./TextHighlighter";
import type {TestCase, Match, Mode, SolveResult, RegexError} from "../types";

export class Text extends EventDispatcher {
    public el: HTMLElement;
    public resultEl!: HTMLElement;
    public modeListEl!: HTMLElement;
    public modeList!: List<{id: Mode, label: string}>;
    public defaultText!: string;
    public editor!: CodeMirror.Editor;
    public canvas!: HTMLCanvasElement;
    public highlighter!: TextHighlighter;
    public hover!: TextHover;
    public _result?: SolveResult;
    public _emptyCount = 0;
    public _testFails = 0;
    public _tests: TestCase[] = [];
    public _testMatches: Record<string, Match> | null = null;
    public typeLabels!: Record<string, string>;
    public testsEl!: HTMLElement;
    public testItemEl!: HTMLElement;
    public testListEl!: HTMLElement;
    public testList!: List<TestCase>;
    public typesEl!: HTMLElement;
    public typesList!: List<{id: TestCase["type"], label: string}>;
    public _testMark?: CodeMirror.TextMarker;
    public testEditor!: CodeMirror.Editor;
    public _selTest: TestCase | null = null;

    public constructor(el: HTMLElement) {
        super();
        this.el = el;
        this._initUI(el);
        this._initTestUI(el);
        app.on("result", () => this._setResult(app.result));
        app.theme.on("change", () => this._handleThemeChange());
    }

    public set value(val: string | undefined) {
        this.editor.setValue(val ?? this.defaultText);
    }

    public get value(): string {
        return this.editor.getValue();
    }

    public set tests(val: TestCase[] | null | undefined) {
        if (!(val instanceof Array)) {
            val = [];
        }
        $.toggleClass(this.testsEl, "tests-added", !!val.length);
        this._tests = this.testList.data = val;
        this._testMatches = null;
        this._reselectTest();
    }

    public get tests(): TestCase[] {
        return this._tests;
    }

    public set mode(val: Mode | undefined) {
        if (val === this.mode) {
            return;
        }
        this.modeList.selected = val || "text";
        this._handleModeChange();
    }

    public get mode(): Mode {
        return this.modeList.selected === "tests" ? "tests" : "text";
    }

    public get selectedMatch() {
        const cm = this.editor;
        return this.getMatchAt(cm.indexFromPos(cm.getCursor()), true);
    }

    public getMatchValue(match: Match | null) {
        // this also works for groups.
        return match ? this.value.substr(match.i, match.l) : null;
    }

    public getMatchAt(index: number, inclusive = false) {
        // also used by TextHover
        let match;
        const offset = (inclusive ? -1 : 0), matches = this._result && this._result.matches;
        if (!matches) {
            return null;
        }
        for (let i = 0, l = matches.length; i < l; i++) {
            match = matches[i];
            if (match.l + match.i - 1 < index + offset) {
                continue;
            }
            if (match.i > index) {
                break;
            }
            return match;
        }
        return null;
    }

    public getEmptyTest(): TestCase {
        return {
            id: UID.id,
            name: "",
            text: "Enter your test text here.",
            type: "any"
        };
    }

    // private methods:
    public _initUI(el: HTMLElement) {
        this.resultEl = $.query("> header .result", el);
        this.resultEl.addEventListener("mouseenter", (evt) => this._mouseResult(evt));
        this.resultEl.addEventListener("mouseleave", (evt) => this._mouseResult(evt));

        this.modeListEl = $.query("> header .modelist", el);
        const data = (["text", "tests"] as const).map((id) => ({id, label: lang[id]}));
        this.modeList = new List(this.modeListEl, {data});
        this.modeList.on("change", () => this._handleModeChange());
        this.modeList.selected = "text";

        const textEl = $.query(".editor > .pad", el);
        this.defaultText = $.query<HTMLTextAreaElement>("textarea", textEl).value;
        const editor = this.editor = CMUtils.create($.empty(textEl), {mode: "text/plain", lineWrapping: true}, "100%", "100%");
        editor.setValue(this.defaultText);

        editor.on("change", () => this._change());
        editor.on("scroll", () => this._update());
        editor.on("cursorActivity", () => this._updateSelected());

        const detector = $.create("iframe", "resizedetector", null, textEl), win = detector.contentWindow!;
        const canvas = this.canvas = $.create("canvas", "highlights", null, textEl);
        textEl.appendChild(editor.getWrapperElement()); // move the editor on top of the iframe & canvas.

        const resize = () => {
            const w = win.innerWidth | 0, h = win.innerHeight | 0;
            this._startResize();
            Utils.defer(() => this._handleResize(w, h), "text_resize", 250);
        };
        win.onresize = resize;
        resize();

        this.highlighter = new TextHighlighter(editor, canvas, $.getCSSValue("match", "color"), $.getCSSValue("selected-stroke", "color"));
        this.hover = new TextHover(editor, this.highlighter);
    }

    public _handleThemeChange() {
        this.highlighter.fill = $.getCSSValue("match", "color");
        this.highlighter.stroke = $.getCSSValue("selected-stroke", "color");
        this.highlighter.redraw();
    }

    public _handleModeChange() {
        this.dispatchEvent("modechange");
        if (this.mode === "text") {
            this.editor.refresh();
        }
    }

    public _setResult(val: SolveResult) {
        this._result = val;
        this._testMatches = null;

        if (this.mode !== val.mode) {
            return;
        }
        if (val.mode === "tests") {
            this._updateTests();
        } else { // mode === "text"
            this._updateEmptyCount();
            this._updateResult();
            this._updateSelected();
            this._deferUpdate();
        }
    }

    public _deferUpdate() {
        Utils.defer(() => this._update(), "Text._update");
    }

    public _update() {
        const result = this._result, matches = result && result.matches;
        if (result && result.mode === "tests") {
            this._updateTests();
        } else { // mode === "text"
            this.hover.matches = this.highlighter.matches = matches;
        }
    }

    public _updateResult() {
        const result = this._result, matches = result && result.matches, l = matches && matches.length;
        let text;

        if (l && result && !result.error) {
            text = format(l === 1 ? lang.matchCount : lang.matchesCount, {count: l}) + (this._emptyCount ? "*" : "");
        } else if (!result || !result.error) {
            text = lang.noMatches;
        }
        this._showResult(text);
    }

    public _showResult(text?: string, clss?: string) {
        const result = this._result, el = this.resultEl;
        $.removeClass(el, "error warning matches pass fail");

        if (result && result.error) {
            if (!text) {
                text = result.error.warning ? lang.warning : lang.error;
            }
            $.addClass(el, "error");
            if (result.error.warning) {
                $.addClass(el, "warning");
            }
        }

        if (clss) {
            $.addClass(el, clss);
        }
        el.textContent = text || "";
        if (result?.time != null) {
            el.innerHTML += "<em> " + format(lang.elapsed, {time: result.time.toFixed(1)}) + "</em>";
        }
    }

    public _updateSelected() {
        const match = this.selectedMatch;
        if (this.highlighter.selectedMatch === match) {
            return;
        }
        this.highlighter.selectedMatch = match;
        this.dispatchEvent("select");
    }

    public _change() {
        this.dispatchEvent("change");
    }

    public _startResize() {
        const canvas = this.canvas, style = canvas.style;
        style.visibility = "hidden";
        style.opacity = "0";
        // keeps it from causing scrollbars:
        canvas.width = canvas.height = 1;
    }

    public _mouseResult(evt: MouseEvent) {
        const tt = app.tooltip.hover, res = this._result, err = res && res.error;
        let str = "";
        if (evt.type === "mouseleave") {
            return tt.hide("result");
        }
        if (err && !err.warning) {
            str = "<span class='error'>" + lang.executionError + ":</span> " + this._errorText(err);
        } else {
            if (err && err.warning) {
                str = "<span class='error warning'>" + lang.warning + ":</span> " + this._errorText(err) + "<hr>";
            }
            const l = this.mode === "tests" ? this._tests.length : res?.matches.length || 0;
            if (this.mode === "tests") {
                if (this._tests.length === 0) {
                    str += lang.testHint;
                } else if (this._testFails) {
                    str += format(lang.testsFailed, {failed: this._testFails, total: l});
                } else {
                    str += format(lang.testsPassed, {total: l});
                }
            } else {
                str += format(l === 0 ? lang.foundNone : l === 1 ? lang.foundOne : lang.foundMany, {count: l, length: this.value.length});
                str += this._emptyCount ? format(lang.includingEmpty, {count: this._emptyCount}) : ".";
                const cm = this.editor, sel = cm.listSelections()[0], pos = sel.head;
                const i0 = cm.indexFromPos(pos), i1 = cm.indexFromPos(sel.anchor), range = Math.abs(i0 - i1);
                str += "<hr>" + format(lang.insertionPoint, {line: pos.line, column: pos.ch, index: i0});
                str += (range > 0 ? format(range === 1 ? lang.selectedCharacter : lang.selectedCharacters, {count: range}) : "");
            }
        }
        tt.showOn("result", str, this.resultEl, false, -2);
    }

    public _updateEmptyCount() {
        const result = this._result, matches = result && result.matches;
        this._emptyCount = matches ? matches.reduce((v, o) => v + (o.l ? 0 : 1), 0) : 0;
    }

    public _errorText(err: RegexError) {
        return Utils.htmlSafe(err.message || "") || app.reference.getError(err);
    }

    public _handleResize(w: number, h: number) {
        const canvas = this.canvas, style = canvas.style;
        style.visibility = style.opacity = "";
        canvas.width = w;
        canvas.height = h;
        this.editor.refresh();
        this._deferUpdate();
    }

    // Test mode:
    public _initTestUI(el: HTMLElement) {
        const types: {id: TestCase["type"], label: string}[] = [
            {id: "all", label: lang.matchFull},
            {id: "any", label: lang.matchAny},
            // {id:"start", label:"Match Start"},
            {id: "none", label: lang.matchNone}
        ];
        this.typeLabels = types.reduce<Record<string, string>>((o, t) => {
            o[t.id] = t.label;
            return o;
        }, {});

        this.testsEl = $.query(".tests", el);
        this.testItemEl = $.query("#library > #tests_item");
        this.testListEl = $.query(".list", this.testsEl);
        this.testList = new List<TestCase>(this.testListEl, {template: (o) => this._testItemTemplate(o)});
        this.testList.scrollEl = this.testsEl;

        this.testList.on("change", (evt) => this._handleTestChange());

        $.on($.queryAll(".button.add", el), "click", () => this._addTest());

        const template = $.template`<svg class="inline check icon"><use xlink:href="#check"></use></svg> ${"label"}`;
        this.typesEl = $.query("#library #tooltip-testtypes");
        this.typesList = new List($.query("ul.list", this.typesEl), {data: types, template});
        this.typesList.on("change", () => this._handleTypesChange());

        this.tests = null;
    }

    public _updateTests() {
        const result = this._result;
        if (!result || result.error) {
            return this._showResult();
        }

        const data = this._tests, l = data.length;
        if (!data || !l) {
            return this._showResult(lang.noTests);
        }

        const matches = result.matches.reduce<Record<string, Match>>((o, t) => {
            if (t.id) {
                o[t.id] = t;
            }
            return o;
        }, {});
        let fails = 0;
        for (let i = 0; i < l; i++) {
            const test = data[i], match = matches[test.id];
            let pass = false;
            const el = this.testList.getEl(test.id);
            if (test.type === "none") {
                pass = (!match || match.i < 0);
            } else if (test.type === "all") {
                pass = (!!match && match.i === 0 && match.l === test.text.length);
            } else if (test.type === "start") {
                pass = (match?.i === 0);
            } else { // any
                pass = (!!match && match.i >= 0);
            }
            $.toggleClass(el, "fail", !pass);
            if (!pass) {
                fails++;
            }
        }

        this._testFails = fails;
        this._testMatches = matches;
        if (fails) {
            this._showResult(format(lang.failedCount, {count: fails}), "fail");
        } else {
            this._showResult(lang.passedResult, "pass");
        }

        this._updateSelTest();
    }

    public _updateSelTest() {
        if (this._testMark) {
            this._testMark.clear();
        }
        const matches = this._testMatches, el = this.testList.selectedEl;
        if (!el || !matches) {
            return;
        }
        const match = matches[this.testList.selected!], cm = this.testEditor;
        if (match && match.i >= 0) {
            const pos = CMUtils.calcRangePos(cm, match.i, match.l);
            this._testMark = this.testEditor.getDoc().markText(pos.startPos, pos.endPos, {className: "match"});
        }
    }

    public _testItemTemplate(o: TestCase) {
        const el = this.testItemEl.cloneNode(true) as HTMLElement;
        const typeBtn = $.query("header .button.type", el);
        typeBtn.addEventListener("click", (evt) => this._showTypes(typeBtn, o));

        const delBtn = $.query("header .delete", el);
        delBtn.addEventListener("click", (evt) => this._deleteTest(o));

        const nameFld = $.query<HTMLInputElement>("header .name", el);
        nameFld.addEventListener("input", () => this._handleTestNameChange(nameFld, o));

        this._updateTestHeader(o, el, false);

        return el;
    }

    public _updateTestHeader(o: TestCase, el: HTMLElement, edit: boolean) {
        const nameFld = $.query<HTMLInputElement>("header .name", el);
        nameFld.value = o.name || "";
        nameFld.placeholder = o.text && !edit ? o.text.substr(0, 100) : lang.untitledTest;

        const typeLbl = $.query("header .button.type .label", el);
        typeLbl.innerText = this.typeLabels[o.type];
    }

    public _addTest() {
        const o = this.getEmptyTest();
        this._tests.push(o);
        this.testList.addItem(o, true);
        this._handleTestChange();
        this.testEditor.execCommand("selectAll");
        $.addClass(this.testsEl, "tests-added");
        this._change();
    }

    public _reselectTest() {
        if (this._selTest) {
            this.testList.selected = this._selTest.id;
        }
        if (!this._selTest || this.testList.selected == null) {
            this.testList.selectedIndex = 0;
        }
        this._selTest = null;
        this._handleTestChange(false);
    }

    public _handleTestChange(focus = true) {
        let el, o;
        if (this._selTest) {
            o = this._selTest;
            el = this.testList.getEl(o.id);
            this._updateTestHeader(o, el, false);
        }

        el = this.testList.selectedEl;
        o = this._selTest = this.testList.selectedItem;

        if (!o) {
            return;
        }

        this._getTestEditor($.query("article .editor .pad", el), o);
        this._updateTestHeader(o, el, true);
        this._updateSelTest();
        if (focus) {
            this.testEditor.focus();
        }
        this.testEditor.setCursor(this.testEditor.lineCount(), 0);
    }

    public _handleTestNameChange(fld: HTMLInputElement, o: TestCase) {
        o.name = fld.value;
        this._change();
    }

    public _handleTypesChange() {
        const el = this.testList.selectedEl, o = this.testList.selectedItem;
        o.type = this.typesList.selectedItem.id;
        app.tooltip.toggle.hide("testtypes");
        this._updateTestHeader(o, el, true);
        this._change();
    }

    public _handleTestTextChange(change: CodeMirror.EditorChange) {
        if (!this._selTest) {
            return;
        }
        this._selTest.text = this.testEditor.getValue();
        if (change.origin !== "setValue") {
            this._change();
        }
    }

    public _showTypes(el: HTMLElement, o: TestCase) {
        this.typesList.selected = o.type;
        app.tooltip.toggle.toggleOn("testtypes", this.typesEl, el, true, -2);
    }

    public _deleteTest(o: TestCase) {
        const data = this._tests;
        const i = data.indexOf(o);
        data.splice(i, 1);
        $.toggleClass(this.testsEl, "tests-added", !!data.length);
        this._selTest = null;
        this.testList.removeItem(o.id);
        if (data.length) {
            this.testList.selected = data[Math.min(i, data.length - 1)].id;
        }
        this._updateTests();
        this._handleTestChange();
        this._change();
    }

    public _getTestEditor(el: HTMLElement, o: TestCase) {
        let cm = this.testEditor;
        if (!cm) {
            cm = this.testEditor = CMUtils.create($.empty(el), {mode: "text/plain", lineWrapping: true}, "100%", "100%");
            cm.on("change", (a, b) => this._handleTestTextChange(b));
        } else {
            el.appendChild(cm.getWrapperElement());
        }
        cm.setValue(o.text);
    }
}
