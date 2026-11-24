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

// this is just raw content for the Reference.
// right now all examples are executed in-browser, so they need to be compatible. Maybe swap to XRegExp at some point.
// TODO: rewrite to use multiline template literals?

import type {ReferenceContent} from "../types";

const referenceContent: ReferenceContent = {kids: [], misc: {kids: []}, errors: {}}, o = referenceContent;
export {referenceContent};

o.label = lang.refTitle;
o.id = "reference";
o.search = true;
o.desc = lang.refDescription;

o.kids = [
    {
        label: lang.refCharclassesLabel,
        id: "charclasses",
        desc: lang.refCharclassesDesc,
        kids: [

            {
                id: "set",
                label: lang.refSetLabel,
                desc: lang.refSetDesc,
                example: ["[aeiou]", "glib jocks vex dwarves!"],
                token: "[ABC]"
            },
            {
                id: "setnot",
                label: lang.refSetnotLabel,
                desc: lang.refSetnotDesc,
                example: ["[^aeiou]", "glib jocks vex dwarves!"],
                token: "[^ABC]"
            },
            {
                id: "range",
                label: lang.refRangeLabel,
                tip: lang.refRangeTip,
                example: ["[g-s]", "abcdefghijklmnopqrstuvwxyz"],
                desc: lang.refRangeDesc,
                token: "[A-Z]"
            },
            {
                id: "posixcharclass",
                tip: lang.refPosixcharclassTip,
                label: lang.refPosixcharclassLabel,
                desc: lang.refPosixcharclassDesc,
                token: "[:alnum:]"
            },
            {
                id: "dot",
                label: lang.refDotLabel,
                tip: lang.refDotTip,
                desc: lang.refDotDesc,
                ext: lang.refDotExt,
                example: [".", "glib jocks vex dwarves!"],
                token: "."
            },
            {
                id: "matchanyset",
                label: lang.refMatchanysetLabel,
                desc: lang.refMatchanysetDesc,
                example: ["[\\s\\S]", "glib jocks vex dwarves!"],
                token: "[\\s\\S]"
            },
            {
                id: "unicodegrapheme",
                label: lang.refUnicodegraphemeLabel,
                desc: lang.refUnicodegraphemeDesc,
                ext: lang.refUnicodegraphemeExt,
                token: "\\X"
            },
            {
                id: "word",
                label: lang.refWordLabel,
                desc: lang.refWordDesc,
                ext: lang.refWordExt,
                example: ["\\w", "bonjour, mon fr\u00E8re"],
                token: "\\w"
            },
            {
                id: "notword",
                label: lang.refNotwordLabel,
                desc: lang.refNotwordDesc,
                ext: lang.refNotwordExt,
                example: ["\\W", "bonjour, mon fr\u00E8re"],
                token: "\\W"
            },
            {
                id: "digit",
                label: lang.refDigitLabel,
                desc: lang.refDigitDesc,
                ext: lang.refDigitExt,
                example: ["\\d", "+1-(444)-555-1234"],
                token: "\\d"
            },
            {
                id: "notdigit",
                label: lang.refNotdigitLabel,
                desc: lang.refNotdigitDesc,
                ext: lang.refNotdigitExt,
                example: ["\\D", "+1-(444)-555-1234"],
                token: "\\D"
            },
            {
                id: "whitespace",
                label: lang.refWhitespaceLabel,
                desc: lang.refWhitespaceDesc,
                example: ["\\s", "glib jocks vex dwarves!"],
                token: "\\s"
            },
            {
                id: "notwhitespace",
                label: lang.refNotwhitespaceLabel,
                desc: lang.refNotwhitespaceDesc,
                example: ["\\S", "glib jocks vex dwarves!"],
                token: "\\S"
            },
            {
                id: "hwhitespace",
                label: lang.refHwhitespaceLabel,
                desc: lang.refHwhitespaceDesc,
                token: "\\h"
            },
            {
                id: "nothwhitespace",
                label: lang.refNothwhitespaceLabel,
                desc: lang.refNothwhitespaceDesc,
                token: "\\H"
            },
            {
                id: "vwhitespace",
                label: lang.refVwhitespaceLabel,
                desc: lang.refVwhitespaceDesc,
                token: "\\v"
            },
            {
                id: "notvwhitespace",
                label: lang.refNotvwhitespaceLabel,
                desc: lang.refNotvwhitespaceDesc,
                token: "\\V"
            },
            {
                id: "linebreak",
                label: lang.refLinebreakLabel,
                desc: lang.refLinebreakDesc,
                token: "\\R"
            },
            {
                id: "notlinebreak",
                label: lang.refNotlinebreakLabel,
                desc: lang.refNotlinebreakDesc,
                ext: lang.refNotlinebreakExt,
                token: "\\N"
            },
            {
                id: "unicodecat",
                tip: lang.refUnicodecatTip,
                label: lang.refUnicodecatLabel,
                desc: lang.refUnicodecatDesc,
                ext: lang.refUnicodecatExt,
                token: "\\p{L}"
            },
            {
                id: "notunicodecat",
                tip: lang.refNotunicodecatTip,
                label: lang.refNotunicodecatLabel,
                desc: lang.refNotunicodecatDesc,
                ext: lang.refNotunicodecatExt,
                token: "\\P{L}"
            },
            {
                id: "unicodescript",
                tip: lang.refUnicodescriptTip,
                label: lang.refUnicodescriptLabel,
                desc: lang.refUnicodescriptDesc,
                token: "\\p{Han}"
            },
            {
                id: "notunicodescript",
                tip: lang.refNotunicodescriptTip,
                label: lang.refNotunicodescriptLabel,
                desc: lang.refNotunicodescriptDesc,
                ext: lang.refNotunicodescriptExt,
                token: "\\P{Han}"
            }
        ]
    },

    {
        label: lang.refAnchorsLabel,
        id: "anchors",
        desc: lang.refAnchorsDesc,
        kids: [
            {
                id: "bos",
                label: lang.refBosLabel,
                desc: lang.refBosDesc,
                ext: lang.refBosExt,
                token: "\\A"
            },
            {
                id: "eos",
                label: lang.refEosLabel,
                desc: lang.refEosDesc,
                ext: lang.refEosExt,
                token: "\\Z"
            },
            {
                id: "abseos",
                label: lang.refAbseosLabel,
                desc: lang.refAbseosDesc,
                ext: lang.refAbseosExt,
                token: "\\z"
            },
            {
                id: "bof",
                label: lang.refBofLabel,
                desc: lang.refBofDesc,
                ext: lang.refBofExt,
                example: ["^\\w+", "she sells seashells"],
                token: "^"
            },
            {
                id: "eof",
                label: lang.refEofLabel,
                desc: lang.refEofDesc,
                ext: lang.refEofExt,
                example: ["\\w+$", "she sells seashells"],
                token: "$"
            },
            {
                id: "wordboundary",
                label: lang.refWordboundaryLabel,
                desc: lang.refWordboundaryDesc,
                ext: lang.refWordboundaryExt,
                example: ["s\\b", "she sells seashells"],
                token: "\\b"
            },
            {
                id: "notwordboundary",
                label: lang.refNotwordboundaryLabel,
                desc: lang.refNotwordboundaryDesc,
                ext: lang.refNotwordboundaryExt,
                example: ["s\\B", "she sells seashells"],
                token: "\\B"
            },
            {
                id: "prevmatchend",
                label: lang.refPrevmatchendLabel,
                desc: lang.refPrevmatchendDesc,
                ext: lang.refPrevmatchendExt,
                token: "\\G"
            }
        ]
    },

    {
        label: lang.refEsccharsLabel,
        id: "escchars",
        desc: lang.refEsccharsDesc,
        kids: [
            {
                id: "reservedchar",
                label: lang.refReservedcharLabel,
                desc: lang.refReservedcharDesc,
                example: ["\\+", "1 + 1 = 2"],
                token: "\\+",
                show: true
            },
            {
                id: "escoctal",
                label: lang.refEscoctalLabel,
                desc: lang.refEscoctalDesc,
                ext: lang.refEscoctalExt,
                example: ["\\251", "RegExr is \u00A92014"],
                token: "\\000"
            },
            {
                id: "eschexadecimal",
                label: lang.refEschexadecimalLabel,
                desc: lang.refEschexadecimalDesc,
                example: ["\\xA9", "RegExr is \u00A92014"],
                token: "\\xFF"
            },
            {
                id: "escunicodeu",
                label: lang.refEscunicodeuLabel,
                desc: lang.refEscunicodeuDesc,
                example: ["\\u00A9", "RegExr is \u00A92014"],
                token: "\\uFFFF"
            },
            {
                id: "escunicodeub",
                label: lang.refEscunicodeubLabel,
                desc: lang.refEscunicodeubDesc,
                ext: lang.refEscunicodeubExt,
                token: "\\u{FFFF}"
            },
            {
                id: "escunicodexb",
                label: lang.refEscunicodexbLabel,
                desc: lang.refEscunicodexbDesc,
                token: "\\x{FF}"
            },
            {
                id: "esccontrolchar",
                label: lang.refEsccontrolcharLabel,
                desc: lang.refEsccontrolcharDesc,
                ext: lang.refEsccontrolcharExt,
                token: "\\cI"
            },
            {
                id: "escsequence",
                label: lang.refEscsequenceLabel,
                tip: lang.refEscsequenceTip,
                desc: lang.refEscsequenceDesc,
                ext: lang.refEscsequenceExt,
                token: "\\Q...\\E"
            }
        ]
    },

    {
        label: lang.refGroupsLabel,
        id: "groups",
        desc: lang.refGroupsDesc,
        kids: [
            {
                id: "group",
                label: lang.refGroupLabel,
                desc: lang.refGroupDesc,
                example: ["(ha)+", "hahaha haa hah!"],
                token: "(ABC)"
            },
            {
                id: "namedgroup",
                label: lang.refNamedgroupLabel,
                tip: lang.refNamedgroupTip,
                desc: lang.refNamedgroupDesc,
                ext: lang.refNamedgroupExt,
                token: "(?<name>ABC)"
            },
            {
                id: "namedref",
                label: lang.refNamedrefLabel,
                tip: lang.refNamedrefTip,
                desc: lang.refNamedrefDesc,
                ext: lang.refNamedrefExt,
                token: "\\k'name'"
            },
            {
                id: "numref",
                label: lang.refNumrefLabel,
                tip: lang.refNumrefTip,
                desc: lang.refNumrefDesc,
                example: ["(\\w)a\\1", "hah dad bad dab gag gab"],
                token: "\\1"
            },
            {
                id: "branchreset",
                label: lang.refBranchresetLabel,
                desc: lang.refBranchresetDesc,
                ext: lang.refBranchresetExt,
                token: "(?|(a)|(b))"
            },
            {
                id: "noncapgroup",
                label: lang.refNoncapgroupLabel,
                desc: lang.refNoncapgroupDesc,
                example: ["(?:ha)+", "hahaha haa hah!"],
                token: "(?:ABC)"
            },
            {
                id: "atomic",
                label: lang.refAtomicLabel,
                desc: lang.refAtomicDesc,
                ext: lang.refAtomicExt,
                token: "(?>ABC)"
            },
            {
                id: "define",
                label: lang.refDefineLabel,
                desc: lang.refDefineDesc,
                ext: lang.refDefineExt,
                token: "(?(DEFINE)(?'foo'ABC))"
            },
            {
                id: "numsubroutine",
                label: lang.refNumsubroutineLabel,
                tip: lang.refNumsubroutineTip,
                desc: lang.refNumsubroutineDesc,
                ext: lang.refNumsubroutineExt,
                token: "\\g'1'"
            },
            {
                id: "namedsubroutine",
                label: lang.refNamedsubroutineLabel,
                tip: lang.refNamedsubroutineTip,
                desc: lang.refNamedsubroutineDesc,
                ext: lang.refNamedsubroutineExt,
                token: "\\g'name'"
            }
        ]
    },

    {
        label: lang.refLookaroundLabel,
        id: "lookaround",
        desc: lang.refLookaroundDesc,
        kids: [
            {
                id: "poslookahead",
                label: lang.refPoslookaheadLabel,
                desc: lang.refPoslookaheadDesc,
                example: ["\\d(?=px)", "1pt 2px 3em 4px"],
                token: "(?=ABC)"
            },
            {
                id: "neglookahead",
                label: lang.refNeglookaheadLabel,
                desc: lang.refNeglookaheadDesc,
                example: ["\\d(?!px)", "1pt 2px 3em 4px"],
                token: "(?!ABC)"
            },
            {
                id: "poslookbehind",
                label: lang.refPoslookbehindLabel,
                desc: lang.refPoslookbehindDesc,
                token: "(?<=ABC)"
            },
            {
                id: "neglookbehind",
                label: lang.refNeglookbehindLabel,
                desc: lang.refNeglookbehindDesc,
                token: "(?<!ABC)"
            },
            {
                id: "keepout",
                label: lang.refKeepoutLabel,
                desc: lang.refKeepoutDesc,
                ext: lang.refKeepoutExt,
                token: "\\K"
            }
        ]
    },

    {
        label: lang.refQuantsLabel,
        id: "quants",
        desc: lang.refQuantsDesc,
        kids: [
            {
                id: "plus",
                label: lang.refPlusLabel,
                desc: lang.refPlusDesc,
                example: ["b\\w+", "b be bee beer beers"],
                token: "+"
            },
            {
                id: "star",
                label: lang.refStarLabel,
                desc: lang.refStarDesc,
                example: ["b\\w*", "b be bee beer beers"],
                token: "*"
            },
            {
                id: "quant",
                label: lang.refQuantLabel,
                tip: lang.refQuantTip,
                desc: lang.refQuantDesc,
                example: ["b\\w{2,3}", "b be bee beer beers"],
                token: "{1,3}"
            },
            {
                id: "opt",
                label: lang.refOptLabel,
                desc: lang.refOptDesc,
                example: ["colou?r", "color colour"],
                token: "?"
            },
            {
                id: "lazy",
                label: lang.refLazyLabel,
                tip: lang.refLazyTip,
                desc: lang.refLazyDesc,
                ext: lang.refLazyExt,
                example: ["b\\w+?", "b be bee beer beers"],
                token: "?"
            },
            {
                id: "possessive",
                label: lang.refPossessiveLabel,
                desc: lang.refPossessiveDesc,
                ext: lang.refPossessiveExt,
                token: "+"
            },
            {
                id: "alt",
                label: lang.refAltLabel,
                desc: lang.refAltDesc,
                ext: lang.refAltExt,
                example: ["b(a|e|i)d", "bad bud bod bed bid"],
                token: "|"
            }
        ]
    },

    {
        label: lang.refOtherLabel,
        id: "other",
        desc: lang.refOtherDesc,
        kids: [
            {
                id: "comment",
                label: lang.refCommentLabel,
                desc: lang.refCommentDesc,
                token: "(?#foo)"
            },
            {
                id: "conditional",
                label: lang.refConditionalLabel,
                desc: lang.refConditionalDesc,
                ext: lang.refConditionalExt,
                token: "(?(?=A)B|C)"
            },
            {
                id: "conditionalgroup",
                label: lang.refConditionalgroupLabel,
                desc: lang.refConditionalgroupDesc,
                ext: lang.refConditionalgroupExt,
                token: "(?(1)B|C)"
            },
            {
                id: "recursion",
                label: lang.refRecursionLabel,
                desc: lang.refRecursionDesc,
                ext: lang.refRecursionExt,
                token: "(?R)"
            },
            {
                id: "mode",
                label: lang.refModeLabel,
                tip: lang.refModeTip,
                desc: lang.refModeDesc,
                ext: lang.refModeExt,
                token: "(?i)"
            }
        ]
    },

    {
        label: lang.refSubstLabel,
        desc: lang.refSubstDesc,
        target: "subst",
        id: "subst",
        kids: [
            {
                id: "subst_$&match",
                label: lang.refSubstDollarMatchLabel,
                desc: lang.refSubstDollarMatchDesc,
                token: "$&"
            },
            {
                id: "subst_0match",
                label: lang.refSubst0MatchLabel,
                desc: lang.refSubst0MatchDesc,
                ext: lang.refSubst0MatchExt,
                token: "$0"
            },
            {
                id: "subst_group",
                label: lang.refSubstGroupLabel,
                tip: lang.refSubstGroupTip,
                desc: lang.refSubstGroupDesc,
                // NOTE: javascript profile overrides this:
                ext: lang.refSubstGroupExt,
                token: "$1"
            },
            {
                id: "subst_$before",
                label: lang.refSubstDollarBeforeLabel,
                desc: lang.refSubstDollarBeforeDesc,
                token: "$`"
            },
            {
                id: "subst_$after",
                label: lang.refSubstDollarAfterLabel,
                desc: lang.refSubstDollarAfterDesc,
                token: "$'"
            },
            {
                id: "subst_$esc",
                label: lang.refSubstDollarEscLabel,
                desc: lang.refSubstDollarEscDesc,
                token: "$$"
            },
            {
                id: "subst_esc",
                label: lang.refSubstEscLabel,
                token: "\\n",
                desc: lang.refSubstEscDesc
            }
        ]
    },

    {
        id: "flags",
        label: lang.refFlagsLabel,
        tooltip: lang.refFlagsTooltip,
        desc: lang.refFlagsDesc,
        target: "flags",
        kids: [
            {
                id: "caseinsensitive",
                label: lang.refCaseinsensitiveLabel,
                desc: lang.refCaseinsensitiveDesc,
                ext: lang.refCaseinsensitiveExt,
                token: "i"
            },
            {
                id: "global",
                label: lang.refGlobalLabel,
                tip: lang.refGlobalTip,
                desc: lang.refGlobalDesc,
                token: "g"
            },
            {
                id: "multiline",
                label: lang.refMultilineLabel,
                tip: lang.refMultilineTip,
                desc: lang.refMultilineDesc,
                token: "m"
            },
            {
                id: "unicode",
                label: lang.refUnicodeLabel,
                tip: lang.refUnicodeTip,
                desc: lang.refUnicodeDesc,
                token: "u"
            },
            {
                id: "sticky",
                label: lang.refStickyLabel,
                desc: lang.refStickyDesc,
                ext: lang.refStickyExt,
                token: "y"
            },
            {
                id: "dotall",
                label: lang.refDotallLabel,
                desc: lang.refDotallDesc,
                token: "s"
            },
            {
                id: "extended",
                label: lang.refExtendedLabel,
                desc: lang.refExtendedDesc,
                token: "x"
            },
            {
                id: "ungreedy",
                label: lang.refUngreedyLabel,
                tip: lang.refUngreedyTip,
                desc: lang.refUngreedyDesc,
                token: "U"
            }
        ]
    }
];

// content that isn't included in the Reference menu item:
o.misc = {
    kids: [
        {
            id: "ignorews",
            label: lang.refIgnorewsLabel,
            tip: lang.refIgnorewsTip
        },
        {
            id: "extnumref", // alternative syntaxes.
            proxy: "numref"
        },
        {
            id: "char",
            label: lang.refCharLabel,
            tip: lang.refCharTip
        },
        {
            id: "escchar",
            label: lang.refEsccharLabel,
            tip: lang.refEsccharTip
        },
        {
            id: "open",
            label: lang.refOpenLabel,
            tip: lang.refOpenTip
        },
        {
            id: "close",
            label: lang.refCloseLabel,
            tip: lang.refCloseTip
        },
        {
            id: "condition",
            label: lang.refConditionLabel,
            tip: lang.refConditionTip
        },
        {
            id: "conditionalelse",
            label: lang.refConditionalelseLabel,
            tip: lang.refConditionalelseTip
        },
        {
            id: "ERROR",
            label: lang.refERRORLabel,
            tip: lang.refERRORTip
        }
    ]
};

o.errors = {
    groupopen: lang.errorGroupopen,
    groupclose: lang.errorGroupclose,
    setopen: lang.errorSetopen,
    rangerev: lang.errorRangerev,
    quanttarg: lang.errorQuanttarg,
    quantrev: lang.errorQuantrev,
    esccharopen: lang.errorEsccharopen,
    unicodebad: lang.errorUnicodebad,
    posixcharclassbad: lang.errorPosixcharclassbad,
    posixcharclassnoset: lang.errorPosixcharclassnoset,
    notsupported: lang.errorNotsupported,
    fwdslash: lang.errorFwdslash,
    esccharbad: lang.errorEsccharbad,
    extraelse: lang.errorExtraelse,
    unmatchedref: lang.errorUnmatchedref,
    modebad: lang.errorModebad,
    badname: lang.errorBadname,
    dupname: lang.errorDupname,
    branchreseterr: lang.errorBranchreseterr,
    timeout: lang.errorTimeout, // TODO: can we couple this to the help content somehow?

    // warnings:
    jsfuture: lang.errorJsfuture,
    infinite: lang.errorInfinite // TODO: can we couple this to the help content somehow?
};

/*
classes:
quant
set
special
ref
esc
anchor
charclass
group
comment
 */
