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

type Elements = Element | NodeListOf<Element> | null;

function each(elements: Elements, run: (el: Element) => void) {
    if (elements instanceof Element) {
        run(elements);
    } else {
        elements?.forEach(run);
    }
}

export const DOMUtils = {
    query<T extends Element = HTMLElement>(query: string, element: ParentNode = document.body) {
        return element.querySelector<T>(query[0] === ">" ? ":scope " + query : query)!;
    },

    queryAll<T extends Element = HTMLElement>(query: string, element: ParentNode = document.body) {
        return element.querySelectorAll<T>(query[0] === ">" ? ":scope " + query : query);
    },

    removeClass(elements: Elements, className: string | RegExp) {
        each(elements, (el) => {
            const names = typeof className === "string" ? className.split(" ") : [...el.classList].filter((s) => className.test(s));
            el.classList.remove(...names);
        });
    },

    addClass(elements: Elements, className: string) {
        each(elements, (el) => el.classList.add(...className.split(" ")));
    },

    toggleClass(elements: Elements, className: string, value?: boolean) {
        each(elements, (el) => el.classList.toggle(className, value ?? !el.classList.contains(className)));
    },

    hasClass(element: Element, className: string) {
        return element.classList.contains(className);
    },

    remove<T extends Element>(element: T) {
        element.remove();
        return element;
    },

    on(elements: Elements, event: string, listener: EventListener) {
        each(elements, (el) => el.addEventListener(event, listener));
    },

    empty<T extends Element>(element: T) {
        element.replaceChildren();
        return element;
    },

    create<K extends keyof HTMLElementTagNameMap>(
        type: K, className?: string | null, content?: string | HTMLElement | null, parent?: Element
    ) {
        const element = document.createElement(type);
        if (className) {
            element.className = className;
        }
        if (content instanceof HTMLElement) {
            element.appendChild(content);
        } else if (content) {
            element.innerHTML = content;
        }
        if (parent) {
            parent.appendChild(element);
        }
        return element;
    },

    template<K extends string>(strings: TemplateStringsArray, ...keys: K[]) {
        return (o: Partial<Record<K, string>>) => {
            let result = strings[0];
            for (let i = 0; i < keys.length; i++) {
                result += (o[keys[i]] || "") + strings[i + 1];
            }
            return result;
        };
    },

    getCSSValue(name: string, prop: string) {
        const el = this.create("div", name);
        el.style.display = "none";
        el.id = "export";
        document.body.appendChild(el);
        const val = window.getComputedStyle(el).getPropertyValue(prop);
        el.remove();
        return val;
    }
};
