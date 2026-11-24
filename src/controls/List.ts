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

import {DOMUtils as $} from "../utils/DOMUtils";
import {EventDispatcher} from "../events/EventDispatcher";

type Item = {id?: string, label?: string, hide?: boolean, selected?: boolean};
type Row<T> = HTMLLIElement & {item: T};
type Options<T> = {
    multi?: boolean, data?: T[], template?: (item: T) => string | HTMLElement, selected?: string
};

export class List<T extends Item = Item> extends EventDispatcher {
    public el: HTMLElement;
    public scrollEl?: HTMLElement;
    public multi: boolean;
    public template: Options<T>["template"];
    public _data: T[] = [];

    public constructor(el: HTMLElement, opts: Options<T>) {
        super();
        this.el = el;
        this.multi = !!opts.multi;
        this.template = opts.template;
        this.data = opts.data || [];
        if (opts.selected) {
            this.selected = opts.selected;
        }
    }

    public set data(data: T[]) {
        $.empty(this.el);
        this._data = data;
        if (!data || !data.length) {
            return;
        }
        for (let i = 0, l = data.length; i < l; i++) {
            this.addItem(data[i]);
        }
    }

    public get data() {
        return this._data;
    }

    public set selected(ids: string[] | string | undefined) {
        $.removeClass($.queryAll(".selected", this.el), "selected");
        if (!ids) {
            return;
        }
        if (!(ids instanceof Array)) {
            ids = [ids];
        }
        ids.forEach((id) => $.addClass($.query("[data-id='" + CSS.escape(id ?? "") + "']", this.el), "selected"));

        if (!this.multi) {
            this.scrollTo(ids[0]);
        }
    }

    public get selectedIds() {
        const els = $.queryAll("li.selected", this.el);

        const ids = [];
        for (let i = 0, l = els.length; i < l; i++) {
            ids.push(els[i].dataset.id!);
        }
        return ids;
    }

    public get selected(): string | undefined {
        return this.selectedEl?.dataset.id;
    }

    public set selectedIndex(index: number) {
        const data = this.data;
        this.selected = data && data[index] && data[index].id;
    }

    public get selectedIndex() {
        const el = this.selectedEl, id = el && el.dataset.id;
        return id === null ? -1 : this.data.findIndex((o) => o.id === id);
    }

    public get selectedItem() {
        const el = this.selectedEl;
        return el && el.item;
    }

    public get selectedEl() {
        return $.query<Row<T>>("li.selected", this.el);
    }

    public refresh() {
        const sel = this.multi ? this.selectedIds : this.selected;
        this.data = this._data;
        this.selected = sel;
    }

    public addItem(o: T, selected: boolean | null = null) {
        let sel;
        const f = (evt: MouseEvent) => this.handleClick(evt), template = this.template;
        if (o.hide) {
            return;
        }
        const id = o.id || o.label;
        const label = template ? template(o) : o.label;
        if (selected === null) {
            sel = o.selected;
        }
        const item = $.create("li", sel ? "selected" : null, label, this.el);
        item.dataset.id = id;
        Object.assign(item, {item: o});
        if (!item.querySelector("input, button, textarea")) {
            item.tabIndex = 0;
            item.setAttribute("role", "button");
            item.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    item.click();
                }
            });
        }
        item.addEventListener("click", f);
        item.addEventListener("dblclick", f);

        if (selected) {
            this.selected = o.id;
        }
    }

    public removeItem(id: string | undefined) {
        const el = $.query("[data-id='" + CSS.escape(id ?? "") + "']", this.el);
        el?.remove();
    }

    public handleClick(evt: MouseEvent) {
        const id = (evt.currentTarget as HTMLElement).dataset.id, old = this.multi ? this.selectedIds : this.selected;
        if (!this.getEl(id)) {
            return;
        }
        if (evt.type === "dblclick") {
            if (id != null) {
                this.dispatchEvent("dblclick");
            }
            return;
        } else if (this.multi) {
            $.toggleClass(evt.currentTarget as HTMLElement, "selected");
        } else if (old === id) {
            if (id != null) {
                this.dispatchEvent("selclick");
            }
            return;
        } else {
            this.selected = id;
        }
        if (!this.dispatchEvent("change", false, true)) {
            this.selected = old;
        }
    }

    public scrollTo(id = this.selected) {
        const el = this.getEl(id);
        if (!el) {
            return;
        }
        // el.scrollIntoView(); // this is too jumpy, but would handle horizontal.

        const scrollEl = this.scrollEl || this.el;
        const top = el.offsetTop - scrollEl.offsetTop;
        if (top + el.offsetHeight > scrollEl.scrollTop + scrollEl.offsetHeight) {
            scrollEl.scrollTop = top + el.offsetHeight - scrollEl.offsetHeight + 10;
        } else if (top < scrollEl.scrollTop) {
            scrollEl.scrollTop = top - 10;
        }
    }

    public getEl(id: string | undefined) {
        return $.query("[data-id='" + CSS.escape(id ?? "") + "']", this.el);
    }
};
