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
import {Utils} from "../utils/Utils";

import {List} from "../controls/List";
import {ExpressionLexer} from "../ExpressionLexer";
import {regexMode} from "../regexMode";
import {EventDispatcher} from "../events/EventDispatcher";
import {app} from "../app";
import {ExpressionHighlighter} from "./ExpressionHighlighter";
import {ExpressionHover} from "./ExpressionHover";



export class Expression extends EventDispatcher {
    public el: HTMLElement;
    public delim: string;
    public lexer: ExpressionLexer;
    public editorEl!: HTMLElement;
    public editor!: CodeMirror.Editor;
    public errorEl!: HTMLElement;
    public highlighter!: ExpressionHighlighter;
    public hover!: ExpressionHover;
    public flagsBtn!: HTMLElement;
    public flagsEl!: HTMLElement;
    public flagsList!: List;

    public constructor(el: HTMLElement) {
        super();
        this.el = el;
        this.delim = "/";
        this.lexer = new ExpressionLexer();

        this._initUI(el);
        app.flavor.on("change", () => this._onFlavorChange());
        this._onFlavorChange();
    }

    public set value(expression: string | undefined) {
        const regex = Utils.decomposeRegEx(expression || Expression.DEFAULT_EXPRESSION, this.delim);
        this.pattern = regex.source;
        this.flags = regex.flags;
    }

    public get value(): string {
        return this.editor.getValue();
    }

    public set pattern(pattern: string) {
        const index = this.editor.getValue().lastIndexOf(this.delim);
        this.editor.replaceRange(pattern, {line: 0, ch: 1}, {line: 0, ch: index});
        this._deferUpdate();
    }

    public get pattern() {
        return Utils.decomposeRegEx(this.editor.getValue(), this.delim).source;
    }

    public set flags(flags: string) {
        flags = app.flavor.validateFlagsStr(flags);
        const str = this.editor.getValue(), index = str.lastIndexOf(this.delim);
        this.editor.replaceRange(flags, {line: 0, ch: index + 1}, {line: 0, ch: str.length}); // this doesn't work if readOnly is false.
    }

    public get flags() {
        return Utils.decomposeRegEx(this.editor.getValue(), this.delim).flags;
    }

    public get token() {
        return this.lexer.token;
    }

    public showFlags() {
        this.flagsList.selected = this.flags.split("");
        app.tooltip.toggle.toggleOn("flags", this.flagsEl, this.flagsBtn, true, -2);
    }

    public toggleFlag(s: string) {
        const flags = this.flags, i = flags.indexOf(s);
        this.flags = i >= 0 ? flags.replace(s, "") : flags + s;
    }

    public insert(str: string) {
        this.editor.replaceSelection(str, "end");
    }

    public selectAll() {
        CMUtils.selectAll(this.editor);
    }

    // private methods:
    public _initUI(el: HTMLElement) {
        this.editorEl = $.query("> .editor", el);
        const editor = this.editor = CMUtils.create(this.editorEl, {
            mode: regexMode,
            maxLength: 2500,
            singleLine: true
        }, "100%", "100%");

        editor.on("mousedown", (cm, evt) => this._onEditorMouseDown(cm, evt));
        editor.on("change", (cm, evt) => this._onEditorChange(cm, evt));
        editor.on("keydown", (cm, evt) => this._onEditorKeyDown(cm, evt));
        // hacky method to disable overwrite mode on expressions to avoid overwriting flags:
        editor.toggleOverwrite = () => {};

        this.errorEl = $.query(".icon.alert", this.editorEl);
        this.errorEl.addEventListener("mouseenter", (evt) => this._onMouseError(evt));
        this.errorEl.addEventListener("mouseleave", (evt) => this._onMouseError(evt));

        this.highlighter = new ExpressionHighlighter(editor);
        this.hover = new ExpressionHover(editor, this.highlighter);

        this._setInitialExpression();
        this._initTooltips(el);
        this.value = Expression.DEFAULT_EXPRESSION;
    }

    public _setInitialExpression() {
        const editor = this.editor;
        editor.setValue("/./g");

        // leading /
        editor.getDoc().markText({line: 0, ch: 0}, {
            line: 0,
            ch: 1
        }, {
            className: "exp-decorator",
            readOnly: true,
            atomic: true,
            inclusiveLeft: true
        });

        // trailing /g
        editor.getDoc().markText({line: 0, ch: 2}, {
            line: 0,
            ch: 4
        }, {
            className: "exp-decorator",
            readOnly: false,
            atomic: true,
            inclusiveRight: true
        });
        this._deferUpdate();
    }

    public _deferUpdate() {
        Utils.defer(() => this._update(), "Expression._update");
    }

    public _update() {
        const expr = this.editor.getValue();
        this.lexer.profile = app.flavor.profile;
        const token = this.lexer.parse(expr);
        $.toggleClass(this.editorEl, "error", !!this.lexer.errors.length);
        this.hover.token = token;
        this.highlighter.draw(token);
        this.dispatchEvent("change");
    }

    public _initTooltips(el: HTMLElement) {
        const template = $.template`<svg class="inline check icon"><use xlink:href="#check"></use></svg> ${"label"}`;
        this.flagsBtn = $.query("section.expression .button.flags", el);
        this.flagsEl = $.query("#library #tooltip-flags");
        this.flagsList = new List($.query("ul.list", this.flagsEl), {data: [], multi: true, template});
        this.flagsList.on("change", () => this._onFlagListChange());
        this.flagsBtn.addEventListener("click", (evt) => this.showFlags());
        $.query("button.help", this.flagsEl).addEventListener("click", () => app.sidebar.goto("flags"));
    }

    // event handlers:
    public _onFlagListChange() {
        const sel = this.flagsList.selectedIds;
        this.flags = sel ? sel.join("") : "";
    }

    public _onFlavorChange() {
        const flavor = app.flavor, profile = flavor.profile;

        const supported = Expression.FLAGS.split("").filter((n) => !!profile.flags[n]);
        const labels = Expression.FLAG_LABELS;
        this.flagsList.data = supported.map((n) => ({id: n, label: labels[n]}));
        this.flags = this.flags.split("").filter((n) => !!profile.flags[n])
            .join("");
    }

    public _onEditorMouseDown(cm: CodeMirror.Editor, evt: MouseEvent) {
        // offset by half a character to make accidental clicks less likely:
        const index = CMUtils.getCharIndexAt(cm, evt.clientX - cm.defaultCharWidth() * 0.6, evt.clientY);
        if (index != null && index >= cm.getValue().lastIndexOf(this.delim)) {
            this.showFlags();
        }
    }

    public _onEditorChange(cm: CodeMirror.Editor, evt: CodeMirror.EditorChange) {
        // catches pasting full expressions in.
        // TODO: will need to be updated to work with other delimeters
        this._deferUpdate();
        const str = evt.text[0];
        if (str.length < 3 || !str.match(/^\/.+[^\\]\/[a-z]*$/ig) || evt.from.ch !== 1 || evt.to.ch != 1 + evt.removed![0].length) {
            // not pasting a full expression.
            return;
        }
        this.value = str;
    }

    public _onEditorKeyDown(cm: CodeMirror.Editor, evt: KeyboardEvent) {
        // Ctrl or Command + D by default, will delete the expression and the flags field, Re: https://github.com/gskinner/regexr/issues/74
        // So we just manually reset to nothing here.
        if ((evt.ctrlKey || evt.metaKey) && evt.keyCode == 68) {
            evt.preventDefault();
            this.pattern = "";
        }
    }

    public _onMouseError(evt: MouseEvent) {
        const tt = app.tooltip.hover, errs = this.lexer.errors;
        if (evt.type === "mouseleave") {
            return tt.hide("error");
        }
        if (errs.length === 0) {
            return;
        }
        const err = errs.length === 1 && errs[0].error;
        const str = err ? app.reference.getError(err, errs[0]) : lang.parseProblems;
        const label = err && err.warning ? lang.warning : lang.parseError;
        tt.showOn("error", "<span class='error'>" + label + ":</span> " + str, this.errorEl);
    }

    public static DEFAULT_EXPRESSION = "/([A-Z])\\w+/g";
    public static FLAGS = "gimsuxyU"; // for flag order
    public static FLAG_LABELS: Record<string, string> = {
        "g": lang.flagG,
        "i": lang.flagI,
        "m": lang.flagM,
        "s": lang.flagS,
        "u": lang.flagU,
        "x": lang.flagX,
        "y": lang.flagY,
        "U": lang.flagUngreedy
    };
}
