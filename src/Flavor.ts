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

import {EventDispatcher} from "./events/EventDispatcher";
import {BrowserSolver} from "./helpers/BrowserSolver";

import {profiles, type Profile} from "./profiles/profiles";

export class Flavor extends EventDispatcher {
    public _profile: Profile;
    public _browserSolver: BrowserSolver;
    public _supportMap: Set<string>;

    public constructor() {
        super();
        this._profile = profiles.js;
        this._supportMap = this._buildSupportMap(this._profile);
        this._browserSolver = new BrowserSolver();
    }

    public get value() {
        return this._profile.id;
    }

    public get profile() {
        return this._profile;
    }

    public get solver() {
        return this._browserSolver;
    }

    public isTokenSupported(id: string) {
        return this._supportMap.has(id);
    }

    public getDocs(id: string) {
        return this._profile.docs[id];
    }

    public validateFlags(list: string[]) {
        const flags = this._profile.flags, dupes: Record<string, boolean> = {};
        return list.filter((id) => (!!flags[id] && !dupes[id] && (dupes[id] = true)));
    }

    public validateFlagsStr(str: string) {
        return this.validateFlags(str.split("")).join("");
    }

    public isFlagSupported(id: string) {
        return !!this._profile.flags[id];
    }

    public _buildSupportMap(profile: Profile) {
        return new Set([
            ...Object.values(profile.flags), ...Object.values(profile.charTypes),
            ...Object.values(profile.escCharTypes), ...Object.keys(profile.tokens),
            ...Object.keys(profile.substTokens), ...Object.values(profile.escCharCodes).map((code) => "esc_" + code)
        ]);
    }
}
