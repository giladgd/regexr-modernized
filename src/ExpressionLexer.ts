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
import {Utils} from "./utils/Utils";
import type {Token} from "./types";
import type {Profile} from "./profiles/profiles";


export class ExpressionLexer {
    public _profile!: Profile;
    public string: string | null = null;
    public token: Token | null = null;
    public errors: Token[] = [];
    public captureGroups: Token[] = [];
    public namedGroups: Record<string, Token> = {};
    public branchResetGroups: Token[] = [];
    public _modes: Record<string, boolean> = {};

    public set profile(profile: Profile) {
        this._profile = profile;
        this.string = this.token = null;
        this.errors = [];
        this.captureGroups = [];
        this.namedGroups = {};
    }

    public parse(str: string) {
        if (!this._profile) {
            return null;
        }
        if (str === this.string) {
            return this.token;
        }

        this.token = null;
        this._modes = {};
        this.string = str;
        this.errors = [];
        const capgroups: Token[] = this.captureGroups = [];
        const namedgroups = this.namedGroups = {};
        const brgroups: Token[] = this.branchResetGroups = [];
        const groups: Token[] = [], refs: Token[] = [];
        let i = 0;
        const l = str.length;
        let o, c, token: Token, charset: Token | null = null;
        // previous is the previous token, prv is the previous "active" token (!ignore)
        let prev: Token | null = null, prv: Token | null = null;
        const profile = this._profile, unquantifiable = profile.unquantifiable;
        const charTypes = profile.charTypes;
        const closeIndex = str.lastIndexOf("/");

        for (let i = closeIndex + 1; i < l; i++) {
            this._modes[str[i]] = true;
        }

        while (i < l) {
            c = str[i];

            token = {type: "", i: i, l: 1, prev: prev, prv: prv, modes: this._modes};
            if (prev) {
                prev.next = token;
            } else {
                this.token = token;
            }

            if (i === 0 || i >= closeIndex) {
                this.parseFlag(str, token);
            } else if (c === "(" && !charset) {
                this.parseParen(str, token);
                if (token.close === null) {
                    token.depth = groups.length;
                    groups.push(token);
                }
                if (token.capture) {
                    this.addCaptureGroup(token, groups);
                }
            } else if (c === ")" && !charset) {
                token.type = "groupclose";
                if (groups.length) {
                    o = token.open = groups.pop()!;
                    o.close = token;
                    if (o.type === "branchreset") {
                        brgroups.pop();
                    }
                } else {
                    token.error = {id: "groupclose"};
                }
            } else if (c === "[") {
                charset = this.parseSquareBracket(str, token, charset);
            } else if (c === "]" && charset) {
                token.type = "setclose";
                token.open = charset;
                charset.close = token;
                charset = null;
            } else if (c === "+" && prv && prv.clss === "quant" && profile.tokens.possessive) {
                token.type = "possessive";
                token.related = [prv];
            } else if ((c === "+" || c === "*") && !charset) {
                token.type = charTypes[c];
                token.clss = "quant";
                token.min = (c === "+" ? 1 : 0);
                token.max = -1;
            } else if (c === "{" && !charset && str.substr(i).search(/^{\d+,?\d*}/) !== -1) {
                this.parseQuant(str, token);
            } else if (c === "\\") {
                this.parseBackSlash(str, token, charset, closeIndex);
            } else if (c === "?" && !charset) {
                if (!prv || prv.clss !== "quant") {
                    token.type = charTypes[c];
                    token.clss = "quant";
                    token.min = 0;
                    token.max = 1;
                } else {
                    token.type = "lazy";
                    token.related = [prv];
                }
            } else if (c === "-" && charset && prv && prv.code !== undefined && prv.prv && prv.prv.type !== "range") {
                // this may be the start of a range, but we'll need to validate after the next token.
                token.type = "range";
            } else {
                this.parseChar(str, token, charset);
                if (!charset && this._modes.x && /\s/.test(c)) {
                    token.ignore = true;
                    token.type = "ignorews";
                }
            }

            // post process token:
            // quantifier:
            if (token.clss === "quant") {
                if (!prv || prv.close !== undefined || unquantifiable[prv.type] || (prv.open && unquantifiable[prv.open.type])) {
                    token.error = {id: "quanttarg"};
                } else {
                    token.related = [prv.open || prv];
                }
            }

            // reference:
            if (token.group === true) {
                refs.push(token);
            }

            // conditional:
            const curGroup = groups.length ? groups[groups.length - 1] : null;
            if (curGroup && (curGroup.type === "conditional" || curGroup.type === "conditionalgroup") && token.type === "alt") {
                if (!curGroup.alt) {
                    curGroup.alt = token;
                } else {
                    token.error = {id: "extraelse"};
                }
                token.related = [curGroup];
                token.type = "conditionalelse";
                token.clss = "special";
            } else if (curGroup && curGroup.type === "branchreset") {
                // reset group
                curGroup.curGroupNum = curGroup.inGroupNum;
            }

            // range:
            if (prv && prv.type === "range" && prv.l === 1) {
                this.validateRange(str, token);
            }

            // js warnings:
            // TODO: this isn't ideal, but I'm hesitant to write a more robust solution for a couple of edge cases.
            if (profile.id === "js") {
                this.addJSWarnings(token);
            }

            // general:
            if (token.open && !token.clss) {
                token.clss = token.open.clss;
            }
            if (token.error) {
                this.addError(token);
            }
            i += token.l;
            prev = token;
            if (!token.ignore) {
                prv = token;
            }
        }

        // post processing:
        while (groups.length) {
            this.addError(groups.pop()!, {id: "groupopen"});
        }
        this.matchRefs(refs, capgroups, namedgroups);
        if (charset) {
            this.addError(charset, {id: "setopen"});
        }

        return this.token;
    }

    public addError(token: Token, error = token.error) {
        token.error = error;
        this.errors.push(token);
    }

    public addJSWarnings(token: Token) {
        if (token.error) {
            return;
        }
        if ((token.type === "neglookbehind" || token.type === "poslookbehind") ||
            (token.type === "sticky" || token.type === "unicode" || token.type == "dotall") ||
            (token.type === "unicodecat" || token.type === "unicodescript") ||
            (token.type === "namedgroup")
        ) {
            token.error = {id: "jsfuture", warning: true};
        }
    }

    public addCaptureGroup(token: Token, groups: Token[]) {
        // it would be nice to make branch reset groups actually highlight all of the groups that share the same number
        // that would require switching to arrays of groups for each group num - requires rearchitecture throughout the app.
        const capgroups = this.captureGroups, brgroups = this.branchResetGroups, namedgroups = this.namedGroups;
        if (brgroups.length) {
            const brgroup = brgroups[brgroups.length - 1];
            token.num = ++brgroup.curGroupNum!;
        } else {
            token.num = capgroups.length + 1;
        }
        if (!capgroups[token.num - 1]) {
            capgroups.push(token);
        }
        if (token.name && !token.error) {
            if (/\d/.test(token.name[0])) {
                token.error = {id: "badname"};
            } else if (namedgroups[token.name]) {
                token.error = {id: "dupname"};
                token.related = [namedgroups[token.name]];
            } else {
                namedgroups[token.name] = token;
            }
        }
    }

    public getRef(token: Token, str: string) {
        token.clss = "ref";
        token.group = true;
        token.relIndex = this.captureGroups.length;
        token.name = str;
    }

    public matchRefs(refs: Token[], indexes: Token[], names: Record<string, Token>) {
        while (refs.length) {
            const token = refs.pop()!, name = token.name!;
            let group = names[name];

            if (!group && !isNaN(Number(name))) {
                const sign = name[0];
                let index = parseInt(name) + ((sign === "+" || sign === "-") ? token.relIndex! : 0);
                if (sign === "-") {
                    index++;
                }
                group = indexes[index - 1];
            }
            if (group) {
                token.group = group;
                token.related = [group];
                token.dir = (token.i < group.i) ? 1 : (!group.close || token.i < group.close.i) ? 0 : -1;
            } else {
                delete token.group;
                delete token.relIndex;
                this.refToOctal(token);
                if (token.error) {
                    this.errors.push(token);
                }
            }
        }
    };

    public refToOctal(token: Token) {
        // JS: \# \0 \00 \## = octal

        // JS: without the u flag \8 \9 match "8" "9" in IE, FF & Chrome, and "\8" "\9" in Safari. We support the former.
        // JS: with the u flag, Chrome & FF throw an esc error, Safari does not.

        // TODO: this doesn't handle two digit refs with 8/9 in them. Ex. \18 - not even sure what this is interpreted as.
        let name = token.name!;
        const profile = this._profile;
        if (token.type !== "numref") {
            // not a simple \4 style reference, so can't decompose into an octal.
            token.error = {id: "unmatchedref"};
        } else if (/^[0-7]{2}$/.test(name) || (profile.config.reftooctalalways && /^[0-7]$/.test(name))) { // octal
            const next = token.next, char = String.fromCharCode(next?.code ?? 0);
            if (next?.type === "char" && char >= "0" && char <= "7" && parseInt(name + char, 8) <= 255) {
                name += char;
                this.mergeNext(token);
            }
            token.code = parseInt(name, 8);
            token.clss = "esc";
            token.type = "escoctal";
            delete token.name;
        } else if (name === "8" || name === "9") {
            this.parseEscChar(token, name);
            delete token.name;
        } else {
            token.error = {id: "unmatchedref"};
        }
    };

    public mergeNext(token: Token) {
        const next = token.next!;
        token.next = next.next;
        if (token.next) {
            token.next.prev = token;
        }
        token.l++;
    };

    public parseFlag(str: string, token: Token) {
        // note that this doesn't deal with misformed patterns or incorrect flags.
        const i = token.i, c = str[i];
        if (str[i] === "/") {
            token.type = (i === 0) ? "open" : "close";
            if (i !== 0) {
                token.related = [this.token!];
                this.token!.related = [token];
            }
        } else {
            token.type = this._profile.flags[c];
        }
        // token.clear = true;
    };

    public parseChar(str: string, token: Token, charset: Token | null = null) {
        const c = str[token.i];
        token.type = (!charset && this._profile.charTypes[c]) || "char";
        if (!charset && c === "/") {
            token.error = {id: "fwdslash"};
        }
        if (token.type === "char") {
            token.code = c.charCodeAt(0);
        } else if (ExpressionLexer.ANCHOR_TYPES[token.type]) {
            token.clss = "anchor";
        } else if (token.type === "dot") {
            token.clss = "charclass";
        }
        return token;
    };

    public parseSquareBracket(str: string, token: Token, charset: Token | null) {
        let match;
        if (this._profile.tokens.posixcharclass && (match = str.substr(token.i).match(/^\[(:|\.)([^\]]*?)\1]/))) {
            // posixcharclass: [:alpha:]
            // posixcollseq: [.ch.]

            // TODO: the expression above currently does not catch [.\].]
            token.l = match[0].length;
            token.value = match[2];
            token.clss = "charclass";
            if (match[1] === ":") {
                token.type = "posixcharclass";
                if (!this._profile.posixCharClasses[match[2]]) {
                    token.error = {id: "posixcharclassbad"};
                } else if (!charset) {
                    token.error = {id: "posixcharclassnoset"};
                }
            } else {
                token.type = "posixcollseq";
                // TODO: can this be generalized? Right now, no, because we assign ids that aren't in the profile.
                token.error = {id: "notsupported"};
            }
        } else if (!charset) {
            // set [a-z] [aeiou]
            // setnot [^a-z]
            token.type = token.clss = "set";
            if (str[token.i + 1] === "^") {
                token.l++;
                token.type += "not";
            }
            charset = token;
        } else {
            // [[] (square bracket inside a set)
            this.parseChar(str, token, charset);
        }
        return charset;
    };

    public parseParen(str: string, token: Token) {
        token.clss = token.type = "group";
        if (str[token.i + 1] !== "?") {
            token.close = null; // indicates that it needs a close token.
            token.capture = true;
            return token;
        }

        const sub = str.substr(token.i + 2);
        let match, s = sub[0];

        if (s === ":") {
            // (?:foo)
            token.type = "noncapgroup";
            token.close = null;
            token.l = 3;
        } else if (s === ">") {
            // (?>foo)
            token.type = "atomic";
            token.close = null;
            token.l = 3;
        } else if (s === "|") {
            // (?|(a)|(b))
            token.type = "branchreset";
            token.close = null;
            token.l = 3;
            token.inGroupNum = token.curGroupNum = this.captureGroups.length;
            this.branchResetGroups.push(token);
        } else if (s === "#" && (match = sub.match(/[^)]*\)/))) {
            // (?#foo)
            token.clss = token.type = "comment";
            token.ignore = true;
            token.l = 2 + match[0].length;
        } else if (/^(R|0)\)/.test(sub)) {
            // (?R) (?0)
            token.clss = "ref";
            token.type = "recursion";
            token.l = 4;
        } else if (match = sub.match(/^P=(\w+)\)/i)) {
            // (?P=name)
            token.type = "namedref";
            this.getRef(token, match[1]);
            token.l = match[0].length + 2;
        } else if (/^\(DEFINE\)/.test(sub)) {
            // (?(DEFINE)foo)
            token.type = "define";
            token.close = null;
            token.l = 10;
        } else if (match = sub.match(/^<?[=!]/)) {
            // (?=foo) (?<!foo)
            const isCond = token.prv?.type === "conditional";
            token.clss = isCond ? "special" : "lookaround";
            token.close = null;
            s = match[0];
            token.behind = s[0] === "<";
            token.negative = s[+token.behind] === "!";
            token.type = isCond ? "condition" : (token.negative ? "neg" : "pos") + "look" + (token.behind ? "behind" : "ahead");
            if (isCond) {
                token.prv!.related = [token];
                token.prv!.condition = token;
                token.related = [token.prv!];
            }
            token.l = s.length + 2;
        } else if (
            (match = sub.match(/^<(\w+)>/)) ||
            (this._profile.config.namedgroupalt && ((match = sub.match(/^'(\w+)'/)) || (match = sub.match(/^P<(\w+)>/))))
        ) {
            // (?<name>foo) (?'name'foo) (?P<name>foo)
            token.type = "namedgroup";
            token.close = null;
            token.name = match[1];
            token.capture = true;
            token.l = match[0].length + 2;
        } else if ((match = sub.match(/^([-+]?\d\d?)\)/)) || (match = sub.match(/^(?:&|P>)(\w+)\)/))) {
            // (?1) (?-1) (?&name) (?P>name)
            token.type = (isNaN(Number(match[1])) ? "named" : "num") + "subroutine";
            this.getRef(token, match[1]);
            token.l = match[0].length + 2;
        } else if ((match = sub.match(/^\(([-+]?\d\d?)\)/)) || (match = sub.match(/^\((\w+)\)/))) {
            // (?(1)a|b) (?(-1)a|b) (?(name)a|b)
            this.getRef(token, match[1]);
            token.clss = "special";
            token.type = "conditionalgroup";
            token.close = null;
            token.l = match[0].length + 2;
        } else if (/^\(\?<?[=!]/.test(sub)) {
            // (?(?=if)then|else)
            token.clss = "special";
            token.type = "conditional";
            token.close = null;
            token.l = 2;
        } else if (this.parseMode(token, sub)) {
            // (?i-x)
            // do nothing. handled by parseMode.
        } else {
            // error, found a (? without matching anything. Treat it as a normal group and let it error out.
            token.close = null;
            token.capture = true;
        }

        if (!this._profile.tokens[token.type]) {
            token.error = {id: "notsupported"};
        }

        return token;
    };

    public parseBackSlash(str: string, token: Token, charset: Token | null, closeIndex: number) {
        // Note: Chrome does weird things with \x & \u depending on a number of factors, we ignore this.
        let i = token.i, match;
        const profile = this._profile;
        let sub = str.substr(i + 1);
        const c = sub[0];
        let val;
        if (i + 1 === (closeIndex || str.length)) {
            token.error = {id: "esccharopen"};
            return;
        }

        if (!charset && (match = sub.match(/^\d\d?/))) {
            // \1 to \99
            // write this as a reference for now, and re-write it later if it doesn't match a group
            token.type = "numref";
            this.getRef(token, match[0]);
            token.l += match[0].length;
            return token;
        }
        if (profile.tokens.namedref && !charset && (c === "g" || c === "k")) {
            return this.parseRef(token, sub);
        }

        if (profile.tokens.unicodecat && (!profile.flags.u || this._modes.u) && (c === "p" || c === "P")) {
            // unicode: \p{Ll} \pL
            return this.parseUnicode(token, sub);
        } else if (profile.tokens.escsequence && c === "Q") {
            // escsequence: \Q...\E
            token.type = "escsequence";
            let e = 2;
            if ((i = sub.indexOf("\\E")) !== -1) {
                token.l += i + 2;
                e += 2;
            } else {
                token.l += closeIndex - token.i - 1;
            }
            token.value = str.substr(token.i + 2, token.l - e);
        } else if (profile.tokens.escunicodeub && this._modes.u && (match = sub.match(/^u\{(\d+)}/))) {
            // unicodeu: \u{0061}
            token.type = "escunicodeub";
            token.l += match[0].length;
            token.code = parseInt(match[1], 16);
        } else if (profile.tokens.escunicodeu && (match = sub.match(/^u([\da-fA-F]{4})/))) {
            // unicode: \uFFFF
            // update SubstLexer if this changes:
            token.type = "escunicodeu";
            token.l += match[0].length;
            token.code = parseInt(match[1], 16);
        } else if (profile.tokens.escunicodexb && (match = sub.match(/^x\{(.*?)}/))) {
            // unicode: \x{FFFF}
            token.type = "escunicodexb";
            token.l += match[0].length;
            val = parseInt(match[1], 16);

            if (isNaN(val) || val > 255 || /[^\da-f]/i.test(match[1])) {
                token.error = {id: "esccharbad"};
            } else {
                token.code = val;
            }
        } else if (match = sub.match(/^x([\da-fA-F]{0,2})/)) {
            // hex ascii: \xFF
            token.type = "eschexadecimal";
            token.l += match[0].length;
            token.code = parseInt(match[1] || "0", 16);
        } else if (match = sub.match(/^c([a-zA-Z])?/)) {
            // control char: \cA \cz
            // also handles: \c
            // not supported in JS strings
            token.type = "esccontrolchar";
            if (match[1]) {
                token.code = match[1].toUpperCase().charCodeAt(0) - 64; // A=65
                token.l += 2;
            } else if (profile.config.ctrlcodeerr) {
                token.l++;
                token.error = {id: "esccharbad"};
            } else {
                return this.parseChar(str, token, charset); // this builds the "/" token
            }
        } else if (match = sub.match(/^[0-7]{1,3}/)) {
            // octal ascii: \011
            token.type = "escoctal";
            sub = match[0];
            if (parseInt(sub, 8) > 255) {
                sub = sub.substr(0, 2);
            }
            token.l += sub.length;
            token.code = parseInt(sub, 8);
        } else if (profile.tokens.escoctalo && (match = sub.match(/^o\{(.*?)}/i))) {
            // \o{377}
            token.type = "escoctal";
            token.l += match[0].length;
            val = parseInt(match[1], 8);
            if (isNaN(val) || val > 255 || /[^0-7]/.test(match[1])) {
                token.error = {id: "esccharbad"};
            } else {
                token.code = val;
            }
        } else {
            // single char
            if (token.type = profile.escCharTypes[c]) {
                token.l++;
                token.clss = ExpressionLexer.ANCHOR_TYPES[token.type] ? "anchor" : "charclass";
                return token;
            }

            token.code = profile.escCharCodes[c];
            if (token.code === undefined) {
                // unrecognized.
                return this.parseEscChar(token, c);
            }

            // update SubstLexer if this changes:
            token.l++;
            token.type = "esc_" + token.code;
        }
        token.clss = "esc";
        return token;
    };

    public parseEscChar(token: Token, c: string) {
        // unrecognized escchar: \u \a \8, etc
        // JS: allowed except if u flag set, Safari still allows \8 \9

        const profile = this._profile;
        token.l = 2;
        if ((!profile.badEscChars[c] && profile.tokens.escchar && !this._modes.u) || profile.escChars[c]) {
            token.type = "escchar";
            token.code = c.charCodeAt(0);
            token.clss = "esc";
        } else {
            token.error = {id: "esccharbad"};
        }
    }

    public parseRef(token: Token, sub: string) {
        // namedref: \k<name> \k'name' \k{name} \g{name}
        // namedsubroutine: \g<name> \g'name'
        // numref: \g1 \g+2 \g{2}
        // numsubroutine: \g<-1> \g'1'
        // recursion: \g<0> \g'0'
        const c = sub[0];
        let s = "", match;
        if (match = sub.match(/^[gk](?:'\w*'|<\w*>|{\w*})/)) {
            s = match[0].substr(2, match[0].length - 3);
            if (c === "k" && !isNaN(Number(s))) {
                s = "";
            } // TODO: specific error for numeric \k?
        } else if (match = sub.match(/^g(?:({[-+]?\d+}|<[-+]?\d+>|'[-+]?\d+')|([-+]?\d+))/)) {
            s = match[2] !== undefined ? match[2] : match[1].substr(1, match[1].length - 2);
        }
        const isRef = c === "k" || !(sub[1] === "'" || sub[1] === "<");
        if (!isRef && Number(s) === 0) {
            token.type = "recursion";
            token.clss = "ref";
        } else {
            // namedref, extnumref, namedsubroutine, numsubroutine
            token.type = (isNaN(Number(s)) ? "named" : (isRef ? "ext" : "") + "num") + (isRef ? "ref" : "subroutine");
            this.getRef(token, s);
        }
        token.l += match ? match[0].length : 1;
    };

    public parseUnicode(token: Token, sub: string) {
        // unicodescript: \p{Cherokee}
        // unicodecat: \p{Ll} \pL
        // not: \P{Ll} \p{^Lu}
        let match = sub.match(/p\{\^?([^}]*)}/i), val = match && match[1], not = sub[0] === "P";
        if (!match && (match = sub.match(/[pP]([LMZSNPC])/))) {
            val = match[1];
        } else {
            not = not !== (sub[2] === "^");
        }
        token.l += match ? match[0].length : 1;
        token.type = "unicodecat";
        if (this._profile.unicodeScripts[val || ""]) {
            token.type = "unicodescript";
        } else if (!this._profile.unicodeCategories[val || ""]) {
            val = null;
        }
        if (not) {
            token.type = "not" + token.type;
        }
        if ((!this._profile.config.unicodenegated && sub[2] === "^") || !val) {
            token.error = {id: "unicodebad"};
        }
        token.value = val;
        token.clss = "charclass";
        return token;
    };

    public parseMode(token: Token, sub: string) {
        // (?i-x)

        const match = sub.match(/^[-a-z]+\)/i);
        if (!match) {
            return;
        }
        const supModes = this._profile.modes;
        const modes = Utils.copy({}, this._modes);
        let bad = false, not = false;
        const s = match[0];
        let c;
        token.on = token.off = "";

        for (let i = 0, l = s.length - 1; i < l; i++) {
            c = s[i];
            if (c === "-") {
                not = true;
                continue;
            }
            if (!supModes[c]) {
                bad = true;
                break;
            }
            modes[c] = !not;

            token.on = token.on.replace(c, "");
            if (not) {
                token.off = token.off.replace(c, "");
                token.off += c;
            } else {
                token.on += c;
            }
        }

        token.clss = "special";
        token.type = "mode";
        token.l = match[0].length + 2;

        if (bad) {
            token.error = {id: "modebad"};
            token.errmode = c;
        } else {
            this._modes = modes;
        }
        return token;
    }

    public parseQuant(str: string, token: Token) {
        // quantifier: {0,3} {3} {1,}
        token.type = token.clss = "quant";
        const i = token.i;
        const end = str.indexOf("}", i + 1);
        token.l += end - i;
        const arr = str.substring(i + 1, end).split(",");
        token.min = parseInt(arr[0]);
        token.max = (arr[1] === undefined) ? token.min : (arr[1] === "") ? -1 : parseInt(arr[1]);
        if (token.max !== -1 && token.min > token.max) {
            token.error = {id: "quantrev"};
        }
        return token;
    };

    public validateRange(str: string, end: Token) {
        // char range: [a-z] [\11-\n]
        const next = end, token = end.prv!, prv = token.prv!;
        if (prv.code === undefined || next.code === undefined) {
            // not a range, rewrite as a char:
            this.parseChar(str, token);
        } else {
            token.clss = "set";
            if (prv.code > next.code) {
                // this gets added here because parse has already moved to the next token:
                this.addError(token, {id: "rangerev"});
            }
            // preserve as separate tokens, but treat as one in the UI:
            next.proxy = prv.proxy = token;
            token.set = [prv, token, next];
        }
    };

    public static ANCHOR_TYPES: Record<string, boolean> = {
        "bof": true,
        "eof": true,
        "bos": true,
        "eos": true,
        "abseos": true,
        "wordboundary": true,
        "notwordboundary": true,
        "prevmatchend": true
    };
}
