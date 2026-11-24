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

import {core} from "./core";

import {javascript as js} from "./javascript";

function inherit<T>(base: Record<string, T>, overrides: Record<string, boolean | undefined>) {
    const result = {...base};
    for (const key in overrides) {
        if (overrides[key] === false) {
            delete result[key];
        }
    }
    return result;
}

const profile = {
    ...core, id: js.id, label: js.label, browser: true,
    flags: inherit(core.flags, js.flags),
    escCharCodes: inherit(core.escCharCodes, js.escCharCodes),
    escCharTypes: inherit(core.escCharTypes, js.escCharTypes),
    charTypes: inherit(core.charTypes, {}),
    unquantifiable: inherit(core.unquantifiable, {}),
    badEscChars: {} as Record<string, boolean>,
    unicodeScripts: inherit(js.unicodeScripts === false ? {} : core.unicodeScripts, {}),
    unicodeCategories: inherit(js.unicodeCategories === false ? {} : core.unicodeCategories, {}),
    posixCharClasses: {} as Record<string, boolean>,
    modes: {} as Record<string, boolean>,
    tokens: inherit(core.tokens, js.tokens),
    substTokens: inherit(core.substTokens, js.substTokens),
    config: {...core.config, ...js.config},
    docs: {...js.docs, notunicodecat: js.docs.unicodecat, unicodescript: js.docs.unicodecat,
        notunicodescript: js.docs.unicodecat} as Record<string, {tip?: string, desc?: string, ext?: string}>
};

export type Profile = typeof profile;
export const profiles = {js: profile};
