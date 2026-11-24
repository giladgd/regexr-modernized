type PlainKey =
    | "modernizerName" | "originalAuthorName" | "unicodeDocsLabel"
    | "closeSidebar" | "copyLink" | "appOptions" | "sidebar" | "back" | "historyOptions" | "reference"
    | "searchReference" | "search" | "clearSearch" | "collapseTools" | "toolHelp" | "flagsReference"
    | "untitledTest" | "deleteTest" | "new" | "switchToDarkTheme" | "expression" | "flags"
    | "addTest" | "noMatch" | "retry" | "expressionFlags" | "failed" | "passed" | "matchAll" | "repository"
    | "testIntro" | "pageTitle" | "siteDescription" | "previewDescription"
    | "switchToEnglish" | "language" | "showMoreLanguages" | "languageName" | "shareOpenFailed" | "historyOpenFailed" | "saveFailed"
    | "refreshFailed" | "updateFailed" | "deleteEntry" | "deleteFailed" | "confirmDeleteAll"
    | "confirmDeleteUnpinned" | "clearFailed" | "linkCopied" | "shareLink" | "imported" | "deleteAll"
    | "deleteNonPinned" | "pinned" | "emptyHistory" | "historyLoadFailed" | "unpin" | "pin" | "entryOptions"
    | "rename" | "delete" | "entryName" | "openSidebar" | "example" | "switchToLightTheme" | "replace"
    | "list" | "details" | "explain" | "expandTools" | "text" | "tests" | "matchFull" | "matchAny"
    | "matchNone" | "noTests" | "passedResult" | "noMatches" | "warning" | "error" | "testHint"
    | "executionError" | "parseProblems" | "parseError" | "flagG" | "flagI" | "flagM" | "flagS" | "flagU"
    | "flagX" | "flagY" | "flagUngreedy" | "noResult" | "detailsHint" | "notAvailable" | "noGroups"
    | "emptyMatch" | "explainEmpty" | "explainHint" | "nestedGroups" | "loadText" | "loadExpression"
    | "unrecognized" | "caseInsensitive" | "caseSensitive" | "includingLineBreaks" | "exceptLineBreaks"
    | "greedy" | "lazy" | "many" | "few" | "commandKey" | "controlKey" | "fullMatches" | "unableToRun"
    | "controlChar0" | "controlChar1" | "controlChar2" | "controlChar3" | "controlChar4" | "controlChar5"
    | "controlChar6" | "controlChar7" | "controlChar8" | "controlChar9" | "controlChar10" | "controlChar11"
    | "controlChar12" | "controlChar13" | "controlChar14" | "controlChar15" | "controlChar16"
    | "controlChar17" | "controlChar18" | "controlChar19" | "controlChar20" | "controlChar21"
    | "controlChar22" | "controlChar23" | "controlChar24" | "controlChar25" | "controlChar26"
    | "controlChar27" | "controlChar28" | "controlChar29" | "controlChar30" | "controlChar31"
    | "controlChar32" | "controlChar127" | "unicodeCategoryC" | "unicodeCategoryCc" | "unicodeCategoryCf"
    | "unicodeCategoryCn" | "unicodeCategoryCo" | "unicodeCategoryCs" | "unicodeCategoryL"
    | "unicodeCategoryLAny" | "unicodeCategoryLl" | "unicodeCategoryLm" | "unicodeCategoryLo"
    | "unicodeCategoryLt" | "unicodeCategoryLu" | "unicodeCategoryM" | "unicodeCategoryMc"
    | "unicodeCategoryMe" | "unicodeCategoryMn" | "unicodeCategoryN" | "unicodeCategoryNd"
    | "unicodeCategoryNl" | "unicodeCategoryNo" | "unicodeCategoryP" | "unicodeCategoryPc"
    | "unicodeCategoryPd" | "unicodeCategoryPe" | "unicodeCategoryPf" | "unicodeCategoryPi"
    | "unicodeCategoryPo" | "unicodeCategoryPs" | "unicodeCategoryS" | "unicodeCategorySc"
    | "unicodeCategorySk" | "unicodeCategorySm" | "unicodeCategorySo" | "unicodeCategoryZ"
    | "unicodeCategoryZl" | "unicodeCategoryZp" | "unicodeCategoryZs" | "cheatCharclasses" | "cheatAnchors"
    | "cheatEscchars" | "cheatGroups" | "cheatQuants" | "cheatAny" | "cheatWord" | "cheatNotWord" | "cheatSet"
    | "cheatNegatedSet" | "cheatRange" | "cheatStartEnd" | "cheatBoundary" | "cheatEscape" | "cheatWhitespace"
    | "cheatGroup" | "cheatBackreference" | "cheatNonCapturing" | "cheatLookahead" | "cheatNegativeLookahead"
    | "cheatQuantifiers" | "cheatRepeat" | "cheatBetween" | "cheatLazy" | "cheatAlternation" | "refTitle"
    | "refDescription" | "refCharclassesLabel" | "refCharclassesDesc" | "refSetLabel" | "refSetDesc"
    | "refSetnotLabel" | "refSetnotDesc" | "refRangeDesc" | "refRangeLabel" | "refPosixcharclassLabel"
    | "refPosixcharclassDesc" | "refDotDesc" | "refDotExt" | "refDotLabel" | "refMatchanysetLabel"
    | "refMatchanysetDesc" | "refUnicodegraphemeLabel" | "refUnicodegraphemeDesc" | "refUnicodegraphemeExt"
    | "refWordDesc" | "refWordExt" | "refWordLabel" | "refNotwordLabel" | "refNotwordDesc" | "refNotwordExt"
    | "refDigitDesc" | "refDigitExt" | "refDigitLabel" | "refNotdigitLabel" | "refNotdigitDesc"
    | "refNotdigitExt" | "refWhitespaceDesc" | "refWhitespaceLabel" | "refNotwhitespaceLabel"
    | "refNotwhitespaceDesc" | "refHwhitespaceLabel" | "refHwhitespaceDesc" | "refNothwhitespaceLabel"
    | "refNothwhitespaceDesc" | "refVwhitespaceLabel" | "refVwhitespaceDesc" | "refNotvwhitespaceLabel"
    | "refNotvwhitespaceDesc" | "refLinebreakLabel" | "refLinebreakDesc" | "refNotlinebreakLabel"
    | "refNotlinebreakDesc" | "refNotlinebreakExt" | "refUnicodecatLabel" | "refUnicodecatDesc"
    | "refUnicodecatExt" | "refNotunicodecatLabel" | "refNotunicodecatDesc" | "refNotunicodecatExt"
    | "refUnicodescriptLabel" | "refUnicodescriptDesc" | "refNotunicodescriptLabel"
    | "refNotunicodescriptDesc" | "refNotunicodescriptExt" | "refAnchorsLabel" | "refAnchorsDesc"
    | "refBosLabel" | "refBosDesc" | "refBosExt" | "refEosLabel" | "refEosDesc" | "refEosExt"
    | "refAbseosLabel" | "refAbseosDesc" | "refAbseosExt" | "refBofLabel" | "refBofDesc" | "refBofExt"
    | "refEofLabel" | "refEofDesc" | "refEofExt" | "refWordboundaryLabel" | "refWordboundaryDesc"
    | "refWordboundaryExt" | "refNotwordboundaryLabel" | "refNotwordboundaryDesc" | "refNotwordboundaryExt"
    | "refPrevmatchendLabel" | "refPrevmatchendDesc" | "refPrevmatchendExt" | "refEsccharsLabel"
    | "refEsccharsDesc" | "refReservedcharLabel" | "refEscoctalLabel" | "refEscoctalDesc" | "refEscoctalExt"
    | "refEschexadecimalLabel" | "refEschexadecimalDesc" | "refEscunicodeuLabel" | "refEscunicodeuDesc"
    | "refEscunicodeubLabel" | "refEscunicodeubDesc" | "refEscunicodeubExt" | "refEscunicodexbLabel"
    | "refEscunicodexbDesc" | "refEsccontrolcharLabel" | "refEsccontrolcharDesc" | "refEsccontrolcharExt"
    | "refEscsequenceLabel" | "refEscsequenceDesc" | "refEscsequenceExt" | "refGroupsLabel" | "refGroupsDesc"
    | "refGroupLabel" | "refGroupDesc" | "refNamedgroupLabel" | "refNamedgroupDesc" | "refNamedgroupExt"
    | "refNamedrefLabel" | "refNamedrefDesc" | "refNamedrefExt" | "refNumrefLabel" | "refNumrefDesc"
    | "refBranchresetLabel" | "refBranchresetDesc" | "refBranchresetExt" | "refNoncapgroupLabel"
    | "refNoncapgroupDesc" | "refAtomicLabel" | "refAtomicDesc" | "refAtomicExt" | "refDefineDesc"
    | "refDefineExt" | "refDefineLabel" | "refNumsubroutineLabel" | "refNumsubroutineDesc"
    | "refNumsubroutineExt" | "refNamedsubroutineLabel" | "refNamedsubroutineDesc" | "refNamedsubroutineExt"
    | "refLookaroundLabel" | "refLookaroundDesc" | "refPoslookaheadLabel" | "refPoslookaheadDesc"
    | "refNeglookaheadLabel" | "refNeglookaheadDesc" | "refPoslookbehindLabel" | "refPoslookbehindDesc"
    | "refNeglookbehindLabel" | "refNeglookbehindDesc" | "refKeepoutLabel" | "refKeepoutDesc"
    | "refKeepoutExt" | "refQuantsLabel" | "refQuantsDesc" | "refPlusDesc" | "refPlusLabel" | "refStarDesc"
    | "refStarLabel" | "refQuantLabel" | "refQuantDesc" | "refOptLabel" | "refOptDesc" | "refLazyDesc"
    | "refLazyExt" | "refLazyLabel" | "refPossessiveDesc" | "refPossessiveExt" | "refPossessiveLabel"
    | "refAltLabel" | "refAltDesc" | "refAltExt" | "refOtherLabel" | "refOtherDesc" | "refCommentDesc"
    | "refCommentLabel" | "refConditionalDesc" | "refConditionalExt" | "refConditionalLabel"
    | "refConditionalgroupLabel" | "refConditionalgroupExt" | "refRecursionDesc" | "refRecursionExt"
    | "refRecursionLabel" | "refModeLabel" | "refModeDesc" | "refModeExt" | "refSubstLabel" | "refSubstDesc"
    | "refSubstDollarMatchLabel" | "refSubstDollarMatchDesc" | "refSubst0MatchLabel"
    | "refSubst0MatchDesc" | "refSubst0MatchExt" | "refSubstGroupLabel" | "refSubstGroupDesc"
    | "refSubstGroupExt" | "refSubstDollarBeforeLabel" | "refSubstDollarBeforeDesc"
    | "refSubstDollarAfterLabel" | "refSubstDollarAfterDesc" | "refSubstDollarEscLabel"
    | "refSubstDollarEscDesc" | "refSubstEscLabel" | "refSubstEscDesc" | "refFlagsLabel" | "refFlagsDesc"
    | "refFlagsTooltip" | "refCaseinsensitiveLabel" | "refCaseinsensitiveDesc" | "refCaseinsensitiveExt"
    | "refGlobalLabel" | "refGlobalDesc" | "refGlobalTip" | "refMultilineDesc" | "refMultilineTip"
    | "refMultilineLabel" | "refUnicodeDesc" | "refUnicodeTip" | "refUnicodeLabel" | "refStickyDesc"
    | "refStickyExt" | "refStickyLabel" | "refDotallDesc" | "refDotallLabel" | "refExtendedDesc"
    | "refExtendedLabel" | "refUngreedyDesc" | "refUngreedyTip" | "refUngreedyLabel" | "refIgnorewsLabel"
    | "refIgnorewsTip" | "refCharLabel" | "refEsccharLabel" | "refOpenTip" | "refOpenLabel" | "refCloseTip"
    | "refCloseLabel" | "refConditionTip" | "refConditionLabel" | "refConditionalelseLabel"
    | "refConditionalelseTip" | "refERRORTip" | "refERRORLabel" | "menu" | "errorGroupopen"
    | "errorGroupclose" | "errorSetopen" | "errorRangerev" | "errorQuanttarg" | "errorQuantrev"
    | "errorEsccharopen" | "errorUnicodebad" | "errorPosixcharclassbad" | "errorPosixcharclassnoset"
    | "errorFwdslash" | "errorEsccharbad" | "errorExtraelse" | "errorBadname" | "errorDupname"
    | "errorBranchreseterr" | "errorTimeout" | "errorInfinite" | "helpHistoryLabel" | "helpCheatsheetLabel"
    | "helpHelpLabel" | "helpHelpDesc" | "helpAboutLabel" | "helpGettingStartedLabel"
    | "helpExpressionPanelLabel" | "helpExpressionPanelDesc" | "helpTextPanelLabel" | "helpTextPanelDesc"
    | "helpTestsPanelLabel" | "helpTestsPanelDesc" | "helpToolsPanelLabel" | "helpToolsPanelDesc"
    | "helpReplaceLabel" | "helpReplaceDesc" | "helpListLabel" | "helpListDesc" | "helpDetailsLabel"
    | "helpDetailsDesc" | "helpExplainLabel" | "helpExplainDesc" | "helpMenuLabel" | "helpMenuDesc"
    | "helpQueryStringSupportLabel" | "jsJsLabel";

type WithParameter<Name extends string> = `${string}{{${Name}}}${string}`;

export type LangTexts = Record<PlainKey, string> & {
    modernized: `(${string})` | `（${string}）`,
    modernizedBy: WithParameter<"modernizerProfileLink">,
    originalBy: WithParameter<"originalTeamLink">,
    jsUnicodecatExt: WithParameter<"unicodeDocsLink">,
    homeIntro: WithParameter<"ctrlKey">,
    manualCopy: WithParameter<"link">,
    matchCount: WithParameter<"count">,
    matchesCount: WithParameter<"count">,
    failedCount: WithParameter<"count">,
    testsFailed: WithParameter<"failed"> & WithParameter<"total">,
    testsPassed: WithParameter<"total">,
    elapsed: WithParameter<"time">,
    foundNone: WithParameter<"length">,
    foundOne: WithParameter<"count"> & WithParameter<"length">,
    foundMany: WithParameter<"count"> & WithParameter<"length">,
    includingEmpty: WithParameter<"count">,
    insertionPoint: WithParameter<"line"> & WithParameter<"column"> & WithParameter<"index">,
    selectedCharacter: WithParameter<"count">,
    selectedCharacters: WithParameter<"count">,
    matchNumber: WithParameter<"number">,
    groupNumber: WithParameter<"number">,
    atLeast: WithParameter<"min">,
    between: WithParameter<"min"> & WithParameter<"max">,
    enableModes: WithParameter<"modes">,
    disableModes: WithParameter<"modes">,
    noErrorDocs: WithParameter<"id">,
    noTokenDocs: WithParameter<"id">,
    matchTip: WithParameter<"match"> & WithParameter<"start"> & WithParameter<"end">,
    moreGroups: WithParameter<"count">,
    groupTip: WithParameter<"number"> & WithParameter<"match">,
    refRangeTip: WithParameter<"previousCharacter"> & WithParameter<"nextCharacter"> & WithParameter<"previousCode"> & WithParameter<"nextCode"> & WithParameter<"caseSensitivity">,
    refPosixcharclassTip: WithParameter<"value">,
    refDotTip: WithParameter<"lineBreaks">,
    refUnicodecatTip: WithParameter<"category">,
    refNotunicodecatTip: WithParameter<"category">,
    refUnicodescriptTip: WithParameter<"value">,
    refNotunicodescriptTip: WithParameter<"value">,
    refReservedcharDesc: WithParameter<"escapeCharacters">,
    refEscsequenceTip: WithParameter<"value">,
    refNamedgroupTip: WithParameter<"name">,
    refNamedrefTip: WithParameter<"groupName">,
    refNumrefTip: WithParameter<"groupNumber">,
    refNumsubroutineTip: WithParameter<"groupNumber">,
    refNamedsubroutineTip: WithParameter<"groupName">,
    refQuantTip: WithParameter<"quantity">,
    refLazyTip: WithParameter<"greediness"> & WithParameter<"quantityPreference">,
    refConditionalgroupDesc: WithParameter<"name">,
    refModeTip: WithParameter<"description"> & WithParameter<"modes">,
    refSubstGroupTip: WithParameter<"groupNumber">,
    refCharTip: WithParameter<"character"> & WithParameter<"code"> & WithParameter<"caseSensitivity">,
    refEsccharTip: WithParameter<"character"> & WithParameter<"code">,
    errorNotsupported: WithParameter<"label">,
    errorUnmatchedref: WithParameter<"name">,
    errorModebad: WithParameter<"errmode">,
    errorJsfuture: WithParameter<"label">,
    helpAboutDesc: WithParameter<"version"> & WithParameter<"buildDate"> & WithParameter<"modernizerLink">
        & WithParameter<"originalAuthorLink"> & WithParameter<"originalTeamLink"> & WithParameter<"createJsLink">
        & WithParameter<"codeMirrorLink">,
    helpGettingStartedDesc: WithParameter<"ctrlKey">,
    helpQueryStringSupportDesc: WithParameter<"example">
};

export type LangKey = keyof LangTexts;
