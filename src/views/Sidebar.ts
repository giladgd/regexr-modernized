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

import {List} from "../controls/List";
import {home as content} from "../docs/sidebar_content";


import {app} from "../app";
import {Example} from "./Example";
import {HistoryList} from "./HistoryList";

import type {MenuNode, Token} from "../types";

export class Sidebar {
    public el: HTMLElement;
    public itemEl: HTMLElement | null;
    public history!: HistoryList;
    public _minimized = false;
    public _idMap!: Record<string, MenuNode>;
    public curItem!: MenuNode;
    public selItem?: MenuNode;
    public fullEl!: HTMLElement;
    public titleEl!: HTMLElement;
    public searchFld!: HTMLInputElement;
    public listEl!: HTMLElement;
    public contentEl!: HTMLElement;
    public menuList!: List<MenuNode>;
    public searchMode = false;

    private toggle: HTMLButtonElement;

    public constructor(el: HTMLElement, toggle: HTMLButtonElement) {
        this.toggle = toggle;
        this.el = el;
        this.itemEl = null;
        this._initUI(el);
        this._prepContent(content);
        app.flavor.on("change", () => this._onFlavorChange());
        let id = app.prefs.read("side");
        if (!id || !Object.hasOwn(this._idMap, id) || id === "share") {
            id = "home";
        }
        this.goto(id);
        this.minimize(app.isNarrow);
        app.on("narrow", () => this.minimize(app.isNarrow));
    }

    public minimize(val = true) {
        const hidesFocus = val ? this.el.contains(document.activeElement) : app.isNarrow && app.docEl.contains(document.activeElement);
        this._minimized = val;
        this.el.parentElement!.classList.toggle("sidebar-closed", val);
        this.el.parentElement!.classList.toggle("sidebar-open", !val);
        this.el.inert = val;
        app.docEl.inert = app.isNarrow && !val;
        this.toggle.setAttribute("aria-expanded", String(!val));
        this.toggle.setAttribute("aria-label", val ? lang.openSidebar : lang.closeSidebar);
        app.tooltip.hover.hide();
        app.tooltip.toggle.hide();
        if (hidesFocus) {
            this.toggle.focus({preventScroll: true});
        }
    }

    public goto(id: string) {
        this.show(this._idMap[id]);
    }

    public showToken(token: Token) {
        this.goto(app.reference.idForToken(token));
    }

    public show(item: MenuNode | undefined): void {
        if (!item) {
            return;
        }
        if (item.hide) {
            return this.show(item.parent);
        }
        if (item.id === "menu") {
            return;
        }
        this.minimize(false);
        if (item.id) {
            if (item.id === "home" || (item.parent && item.parent.id === "home") || this._isInReference(item)) {
                app.prefs.write("side", item.id);
            }
        }

        if (!item.el && !item.kids) {
            if (this.searchMode || !item.parent || item.parent === this.curItem) {
                // select a leaf in the current list.
                this.selItem = item;
                this.menuList.selected = item.id;
                return this._showContent(item);
            } else if (item.parent !== this.curItem) {
                // trying to jump to a leaf child without previously showing parent.
                this.show(item.parent);
                return this.show(item);
            }
        }

        this._resetFull();

        this.curItem = item;
        this.titleEl.textContent = item.label || "";
        this.fullEl.dataset.section = item.id;
        if (item.el) {
            this._showEl($.query("#library " + item.el));
        } else {
            this._showContent(item);
        }

        if (item.kids && item.list !== false) {
            $.removeClass(this.fullEl, "no-list");
            this.menuList.data = item.kids;
        }
        if (item.search) {
            $.removeClass(this.fullEl, "no-search");
        }

        if (item.id === "history") {
            void this.history.refresh();
        }
    }

    public back() {
        if (this.curItem.parent) {
            this.show(this.curItem.parent);
        } else {
            this.minimize(true);
        }
    }

    public menuListTemplate(o: MenuNode) {
        return (o.parent && o.parent.id === "home" ? '<svg class="icon"><use xlink:href="#' + o.id + '"></use></svg>' : "") +
               '<span class="label">' + (o.label || o.id) + "</span>" +
               (o.token ? '<span class="token">' + o.token.replace("<", "&lt;") + "</span>" : "") +
               (o.kids || o.el ? '<svg class="icon submenu-chevron" aria-hidden="true"><use href="#arrowright"></use></svg>' : "");
    }

    // private methods:
    public _initUI(el: HTMLElement) {
        // set up full width content:
        this.fullEl = $.query("> .full", el);

        // title bar:
        this.titleEl = $.query(".sidebar-title h2", this.fullEl);
        let hiddenFocus: HTMLElement | null = null;
        this.toggle.onpointerdown = (evt) => evt.preventDefault();
        this.toggle.onclick = (evt) => {
            const active = document.activeElement;
            this.minimize(!this._minimized);
            if (evt.detail > 0 && document.activeElement === this.toggle) {
                hiddenFocus?.focus({preventScroll: true});
                hiddenFocus = active instanceof HTMLElement && active !== this.toggle ? active : null;
            } else {
                hiddenFocus = null;
            }
        };
        $.query(".sidebar-title .back", this.fullEl).addEventListener("click", () => this.back());

        // search:
        const search = $.query<HTMLFormElement>("> .search", this.fullEl);
        this.searchFld = $.query<HTMLInputElement>("input", search);
        this.searchFld.addEventListener("input", () => this._onSearchChange());
        $.query('button[type="button"]', search).addEventListener("click", () => {
            this.searchFld.value = "";
            this._onSearchChange();
            this.searchFld.focus();
        });
        search.addEventListener("submit", (evt) => {
            evt.preventDefault();
            this._onSearchChange();
            this.searchFld.focus();
            this.searchFld.select();
        });

        // list & content:
        this.listEl = $.query(".menu-scroll > .list", this.fullEl);
        this.menuList = new List<MenuNode>(this.listEl, {data: content.kids, template: this.menuListTemplate});
        this.menuList.scrollEl = this.listEl.parentElement!;
        this.menuList.on("change", () => {
            this.show(this.menuList.selectedItem);
        });
        this.menuList.on("dblclick", () => this._onDblClick(this.menuList.selectedItem));
        this.contentEl = $.query(".content-body", this.fullEl);

        this.history = new HistoryList($.query("#history-entries"), $.query(".history-options", this.fullEl));
        this._prepCheatsheet();
    }

    public _resetFull() {
        if (this.itemEl) {
            $.query("#library").appendChild(this.itemEl);
            this.itemEl = null;
        }
        $.addClass(this.fullEl, "no-search no-list");
        this.searchFld.value = "";
        this.searchMode = false;
        this.menuList.template = this.menuListTemplate;
    }

    public _showContent(o: MenuNode) {
        const ref = app.reference;
        this.contentEl.innerHTML = this._isInReference(o) ? ref.getContent(o.id!) : ref.fillTags((o.desc || "") + (o.ext || ""), o, ref);
        if (o.example) {
            this.contentEl.appendChild(new Example(lang.example, o.example).el);
        }
    }

    public _isInReference(o: MenuNode) {
        return this._isIn(o, "reference");
    }

    public _isIn(o: MenuNode, id: string) {
        do {
            if (o.id === id) {
                return true;
            }
        } while (o = o.parent!);
        return false;
    }

    public _onDblClick(o: MenuNode) {
        if (!o) {
            return;
        }
        if (o.token) {
            const expr = app.expression;
            if (o.parent?.id === "flags") {
                expr.toggleFlag(o.token);
            } else {
                expr.insert(o.token);
            }
        }
    }

    public _showEl(el: HTMLElement) {
        if (this.itemEl === el) {
            return;
        }
        this.itemEl = el;
        $.empty(this.contentEl).appendChild(el);
    }

    public _prepContent(content: MenuNode) {
        // inject reference:
        const i = content.kids!.findIndex((o) => o.id === "reference");
        content.kids!.splice(i, 1, app.reference.content);
        // grab home content from HTML:
        content.desc = this.contentEl.innerHTML;
        // build idMap:
        this._idMap = {home: content};
        return Utils.prepMenuContent(content, this._idMap);
    }

    public _prepCheatsheet() {
        let els = $.queryAll("#cheatsheet *[data-id]");
        let f = (evt: MouseEvent) => this.goto((evt.currentTarget as HTMLElement).dataset.id!);
        for (let i = 0, l = els.length; i < l; i++) {
            els[i].addEventListener("click", f);
        }
        els = $.queryAll("#cheatsheet tr td:first-child");
        f = (evt) => app.expression.insert((evt.currentTarget as HTMLElement).innerText);
        for (let i = 0, l = els.length; i < l; i++) {
            const el = els[i], tokens = el.innerText.split(" ");
            $.empty(el);
            for (let j = 0; j < tokens.length; j++) {
                const span = $.create("a", null, tokens[j], el);
                span.addEventListener("click", f);
            }
        }
    }

    public _onSearchChange() {
        const id = this.curItem.id, search = this.searchFld.value;
        if (id === "reference") {
            this._searchReference(search);
        } else {
            return;
        }
        // TODO: this is a hacky way to reset the content:
        this.contentEl.innerHTML = this.curItem.desc || "";
        this.itemEl = null;
    }

    public _searchReference(search: string) {
        const result = app.reference.search(search);
        this.searchMode = !!search;
        this.menuList.data = search ? result : this.curItem.kids || [];
        // TODO: would be nice to show a "no match" message, but difficult to do with `hide=true` entries
    }

    public _onFlavorChange() {
        const item = this.selItem || this.curItem;
        if (!this._isInReference(item)) {
            return;
        }
        this.selItem = undefined;
        this.show(item);
    }
}
