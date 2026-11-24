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
import {Utils} from "../utils/Utils";
import type {MenuNode, ReferenceContent, Token, RegexError, Match} from "../types";
import type {Flavor} from "../Flavor";


export class Reference {
    public _flavor: Flavor;
    public _idMap: Record<string, MenuNode>;
    public _content: ReferenceContent;
    public _misc: MenuNode;

    public constructor(content: ReferenceContent, flavor: Flavor) {
        this._flavor = flavor;
        this._flavor.on("change", () => this._flavorChange());

        this._injectEscChars(content);

        this._idMap = {reference: content};
        this._content = Utils.prepMenuContent(content, this._idMap);
        this._misc = Utils.prepMenuContent(content.misc, this._idMap);
        this._flavorChange();
    }

    public get content() {
        return this._content;
    }

    public search(searchStr: string) {
        function srch(kids: MenuNode[], results: MenuNode[]) {
            for (let i = 0, l = kids.length; i < l; i++) {
                const kid = kids[i];
                let points = 0;
                if (kid.kids) {
                    srch(kid.kids, results);
                    continue;
                }
                if (points = Utils.searchRank(kid, searchStr)) {
                    kid.__searchPoints = points;
                    results.push(kid);
                }
            }
            return results;
        }
        return srch(this.content.kids, []).sort((a, b) => b.__searchPoints! - a.__searchPoints!);
    }

    public idForToken(token: Token) {
        const errId = token.error && token.error.id;
        if (errId && this._idMap[errId]) {
            return errId;
        }
        if (this._idMap[token.type]) {
            return token.type;
        }
        if (token.clss && this._idMap[token.clss]) {
            return token.clss;
        }
        return errId || token.type || token.clss || "";
    }

    // methods used in fillTags:
    public getChar(token: Token) {
        const chr = Reference.NONPRINTING_CHARS[token.code!];
        return chr ? chr : "\"" + String.fromCharCode(token.code!) + "\"";
    }

    public getQuant(token: Token) {
        const min = token.min, max = token.max;
        return min === max ? min : max === -1 ? format(lang.atLeast, {min: min!}) : format(lang.between, {min: min!, max: max!});
    }

    public getUniCat(token: Token) {
        return Reference.UNICODE_CATEGORIES[token.value || ""] || lang.unrecognized;
    }

    public getModes(token: Token) {
        let str = (token.on ? format(lang.enableModes, {modes: token.on}) : "");
        if (token.off) {
            str += format(lang.disableModes, {modes: token.off});
        }
        return str;
    }

    public getInsensitive(token: Token) {
        if (token.code) {
            const chr = String.fromCharCode(token.code!);
            if (chr.toLowerCase() === chr.toUpperCase()) {
                return "";
            }
        }
        return token.modes ? (token.modes.i ? lang.caseInsensitive : lang.caseSensitive) : "";
    }

    public getDotAll(token: Token) {
        return token.modes?.s ? lang.includingLineBreaks : lang.exceptLineBreaks;
    }

    public getLabel(token: Token) {
        const node = this.getNodeForToken(token);
        return node ? node.label || node.id || "" : token.type;
    }

    public getDesc(token: Token) {
        return this.getVal(this.getNodeForToken(token), "desc");
    }

    public getLazy(token: Token) {
        return token.modes?.U ? lang.greedy : lang.lazy;
    }

    public getLazyFew(token: Token) {
        return token.modes?.U ? lang.many : lang.few;
    }

    public getCtrlKey() {
        return Utils.isMac() ? lang.commandKey : lang.controlKey;
    }

    public getEscChars() {
        const o = this._flavor.profile.escChars;
        let str = "";
        for (const n in o) {
            str += n;
        }
        return str;
    }

    public fillTags(str: string, data: Token | MenuNode, functs: Reference, maxLength = 20, htmlSafe = true): string {
        return str.replace(/{{(\w+)}}/g, (_, key: string) => {
            let val = "";
            if (key === "ctrlKey") {
                val = functs.getCtrlKey();
            } else if (key === "escapeCharacters") {
                val = functs.getEscChars();
            } else if ("i" in data) {
                const token = data;
                switch (key) {
                    case "character":
                        val = functs.getChar(token);
                        break;
                    case "previousCharacter":
                        val = token.prev ? functs.getChar(token.prev) : "";
                        break;
                    case "nextCharacter":
                        val = token.next ? functs.getChar(token.next) : "";
                        break;
                    case "quantity":
                        val = String(functs.getQuant(token));
                        break;
                    case "category":
                        val = functs.getUniCat(token);
                        break;
                    case "modes":
                        val = functs.getModes(token);
                        break;
                    case "caseSensitivity":
                        val = functs.getInsensitive(token);
                        break;
                    case "lineBreaks":
                        val = functs.getDotAll(token);
                        break;
                    case "label":
                        val = functs.getLabel(token);
                        break;
                    case "description":
                        val = this.fillTags(functs.getDesc(token), token, functs);
                        break;
                    case "greediness":
                        val = functs.getLazy(token);
                        break;
                    case "quantityPreference":
                        val = functs.getLazyFew(token);
                        break;
                    case "nextCode":
                        val = String(token.next?.code ?? "");
                        break;
                    case "previousCode":
                        val = String(token.prev?.code ?? "");
                        break;
                    case "groupNumber":
                    case "groupName":
                        if (token.group && token.group !== true) {
                            val = String(token.group[key === "groupNumber" ? "num" : "name"] ?? "");
                        }
                        break;
                    case "value":
                    case "errmode":
                    case "code":
                    case "name":
                        val = String(token[key] ?? "");
                        break;
                }
            }
            const limit = ["name", "groupName", "value", "errmode"].includes(key) ? maxLength : 0;
            return key === "description" || key === "label" || key === "modes" ? val : Utils.shorten(val, limit, htmlSafe, "i");
        });
    }

    // returns doc props from the profile or reference as appropriate (ex. tip, desc, ext)
    public getVal(node: MenuNode, prop: "tip" | "desc" | "ext") {
        if (!node) {
            return "";
        }
        const pDocs = this._flavor.getDocs(node.id || ""), pRef = (pDocs && pDocs[prop]);
        if (pRef != null && pRef[0] !== "+") {
            return pRef;
        }
        const ref = (node && node[prop]) || "";
        return pRef != null ? ref + pRef.substr(1) : ref;
    }

    public getNodeForToken(token: Token) {
        let id = this.idForToken(token);
        const clss = token.clss;

        // Special cases:
        if (clss === "quant") {
            id = clss;
        }
        if (clss === "esc" && token.type !== "escsequence") {
            id = "escchar";
        }

        return this.getNode(id);
    }

    public getNode(id: string) {
        const map = this._idMap;
        let node = map[id];
        while (node && node.proxy) {
            node = map[node.proxy];
        }
        return node;
    }

    public getError(error: RegexError, token?: Token) {
        const errId = error && error.id;
        let str = this._content.errors[errId] || format(lang.noErrorDocs, {id: errId});
        if (token) {
            str = this.fillTags(str, token, this, 20);
        }
        return str;
    }

    public tipForToken(token: Token | null) {
        if (!token) {
            return null;
        }

        const node = this.getNodeForToken(token);
        let label, tip;

        if (token.error && !token.error.warning) {
            label = "<span class='error'>" + lang.error + ": </span>";
            tip = this.getError(token.error, token);
        } else {
            label = node ? node.label || node.id || "" : token.type;
            tip = this.getVal(node, "tip") || this.getVal(node, "desc");
            tip = this.fillTags(tip, token, this, 20);
            if (token.type === "group") {
                label += " #" + token.num;
            }
            label = "<b>" + label[0].toUpperCase() + label.substr(1) + ".</b> ";

            if (token.error) {
                tip += "<span class='warningtext'><span class='error warning'>" + lang.warning + ": </span>" + this.getError(token.error, token) + "</span>";
            }
        }

        return tip ? label + tip : format(lang.noTokenDocs, {id: this.idForToken(token)});
    }

    public getContent(id: string) {
        const node = this.getNode(id);
        return this.fillTags(this.getVal(node, "desc") + this.getVal(node, "ext"), node, this);
    }

    // TODO: this isn't necessarily the most ideal place for this method (has nothing to do with Reference). Maybe move into Text?
    public tipForMatch(match: Match | null | undefined, text: string) {
        if (!match) {
            return null;
        }
        let more = match.l > 150;
        let str = format(lang.matchTip, {match: Utils.shorten(text.substr(match.i, match.l), 150, true, "i"), start: match.i, end: match.i + match.l - 1});

        const groups = match.groups || [], l = groups.length;
        for (let i = 0; i < l; i++) {
            if (i > 3 && l > 5) {
                more = false;
                str += "<br><span class='more'>" + format(lang.moreGroups, {count: l - i}) + "</span>";
                break;
            }
            const s = groups[i].s;
            more = more || !!(s && s.length > 50);
            str += (i > 0) ? "<br>" : "<hr>";
            str += format(lang.groupTip, {number: i + 1, match: Utils.shorten(s, 50, true, "i")});
        }
        if (more) {
            str += "<br><span class='more'>" + lang.fullMatches + "</span>";
        }
        return str;
    };

    // private methods:
    public _flavorChange() {
        this._updateHide(this.content);
    }

    public _updateHide(o: MenuNode, list?: string[]): boolean {
        // the list param is for debugging, it is populated with the ids of all nodes that were hidden.
        // parent nodes aren't hidden unless all their children are.
        const kids = o.kids;
        let hide = true;
        if (kids) {
            for (let i = 0, l = kids.length; i < l; i++) {
                hide = this._updateHide(kids[i], list) && hide;
            }
        } else {
            hide = (o.show === false) || (o.show !== true && !!o.id && !this._flavor.isTokenSupported(o.id));
        }
        if (list && hide) {
            list.push(o.id!);
        }
        return (o.hide = hide);
    }

    public _injectEscChars(content: ReferenceContent) {
        const kids = content.kids.find((o) => o.id === "escchars")!.kids!;
        const template = content.misc.kids.find((o) => o.id === "escchar")!.tip!;
        // \x07 - bell, \x1b - esc
        const chars = "\t\n\v\f\r\0\x07\x1b", tokens = "tnvfr0ae"; // .\\+*?^$[]{}()|/
        for (let i = 0, l = chars.length; i < l; i++) {
            kids.push(this._getEscCharDocs(chars[i], tokens[i], template));
        }
    }

    public _getEscCharDocs(c: string, t: string, template: string) {
        const code = c.charCodeAt(0), chr = Reference.NONPRINTING_CHARS[code] || c;
        return {
            id: "esc_" + code,
            token: "\\" + (t || c),
            label: chr.toLowerCase(),
            desc: this.fillTags(template, {i: 0, l: 1, type: "char", code}, this)
        };
    };

    public static NONPRINTING_CHARS: Record<number, string> = {
        "0": lang.controlChar0,
        "1": lang.controlChar1,
        "2": lang.controlChar2,
        "3": lang.controlChar3,
        "4": lang.controlChar4,
        "5": lang.controlChar5,
        "6": lang.controlChar6,
        "7": lang.controlChar7,
        "8": lang.controlChar8,
        "9": lang.controlChar9, //
        "10": lang.controlChar10, //
        "11": lang.controlChar11,
        "12": lang.controlChar12,
        "13": lang.controlChar13, //
        "14": lang.controlChar14,
        "15": lang.controlChar15,
        "16": lang.controlChar16,
        "17": lang.controlChar17,
        "18": lang.controlChar18,
        "19": lang.controlChar19,
        "20": lang.controlChar20,
        "21": lang.controlChar21,
        "22": lang.controlChar22,
        "23": lang.controlChar23,
        "24": lang.controlChar24,
        "25": lang.controlChar25,
        "26": lang.controlChar26,
        "27": lang.controlChar27,
        "28": lang.controlChar28,
        "29": lang.controlChar29,
        "30": lang.controlChar30,
        "31": lang.controlChar31,
        "32": lang.controlChar32, //
        "127": lang.controlChar127
    };
    public static UNICODE_CATEGORIES: Record<string, string> = {
        "C": lang.unicodeCategoryC,
        "Cc": lang.unicodeCategoryCc,
        "Cf": lang.unicodeCategoryCf,
        "Cn": lang.unicodeCategoryCn,
        "Co": lang.unicodeCategoryCo,
        "Cs": lang.unicodeCategoryCs,
        "L": lang.unicodeCategoryL,
        "L&": lang.unicodeCategoryLAny,
        "Ll": lang.unicodeCategoryLl,
        "Lm": lang.unicodeCategoryLm,
        "Lo": lang.unicodeCategoryLo,
        "Lt": lang.unicodeCategoryLt,
        "Lu": lang.unicodeCategoryLu,
        "M": lang.unicodeCategoryM,
        "Mc": lang.unicodeCategoryMc,
        "Me": lang.unicodeCategoryMe,
        "Mn": lang.unicodeCategoryMn,
        "N": lang.unicodeCategoryN,
        "Nd": lang.unicodeCategoryNd,
        "Nl": lang.unicodeCategoryNl,
        "No": lang.unicodeCategoryNo,
        "P": lang.unicodeCategoryP,
        "Pc": lang.unicodeCategoryPc,
        "Pd": lang.unicodeCategoryPd,
        "Pe": lang.unicodeCategoryPe,
        "Pf": lang.unicodeCategoryPf,
        "Pi": lang.unicodeCategoryPi,
        "Po": lang.unicodeCategoryPo,
        "Ps": lang.unicodeCategoryPs,
        "S": lang.unicodeCategoryS,
        "Sc": lang.unicodeCategorySc,
        "Sk": lang.unicodeCategorySk,
        "Sm": lang.unicodeCategorySm,
        "So": lang.unicodeCategorySo,
        "Z": lang.unicodeCategoryZ,
        "Zl": lang.unicodeCategoryZl,
        "Zp": lang.unicodeCategoryZp,
        "Zs": lang.unicodeCategoryZs
    };
}
