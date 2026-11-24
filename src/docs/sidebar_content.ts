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

import {feedbackUrl, renderLinks} from "../links";
import {format, lang, language} from "../lang/language";

import type {MenuNode} from "../types";

const buildDate = new Date(__BUILD_DATE__).toLocaleDateString(language.id, {month: "short", day: "numeric", year: "numeric", timeZone: "UTC"});
const queryExample = document.createElement("a");
queryExample.href = location.origin + location.pathname + "?expression=/cat/i&test=Cat&testTitle=Capitalized&focus=test";
queryExample.textContent = queryExample.href;

const home: MenuNode = {};
export {home};

home.id = "home";
home.label = lang.menu;
home.kids = [

    {
        label: lang.helpHistoryLabel,
        id: "history",
        el: "#history-entries"
    },

    {
        label: lang.helpCheatsheetLabel,
        id: "cheatsheet",
        el: "#cheatsheet"
    },

    { // injected from Reference
        id: "reference"
    },

    {
        label: lang.helpHelpLabel,
        id: "help",
        desc: lang.helpHelpDesc,
        kids: [

            {
                label: lang.helpAboutLabel,
                desc: format(renderLinks(lang.helpAboutDesc, lang, true), {version: __VERSION__, buildDate}) +
                    '<p lang="en" translate="no">You can provide feedback or log bugs on ' +
                    `<a href="${feedbackUrl}" target="_blank" rel="noopener">GitHub</a>.</p>`
            },
            {
                label: lang.helpGettingStartedLabel,
                desc: lang.helpGettingStartedDesc,
                kids: [
                    {
                        label: lang.helpExpressionPanelLabel,
                        desc: lang.helpExpressionPanelDesc
                    },
                    {
                        label: lang.helpTextPanelLabel,
                        desc: lang.helpTextPanelDesc
                    },
                    {
                        label: lang.helpTestsPanelLabel,
                        desc: lang.helpTestsPanelDesc
                    },
                    {
                        label: lang.helpToolsPanelLabel,
                        desc: lang.helpToolsPanelDesc,
                        kids: [
                            {
                                label: lang.helpReplaceLabel,
                                id: "replace",
                                desc: lang.helpReplaceDesc
                            },
                            {
                                label: lang.helpListLabel,
                                id: "list",
                                desc: lang.helpListDesc
                            },
                            {
                                label: lang.helpDetailsLabel,
                                id: "details",
                                desc: lang.helpDetailsDesc
                            },
                            {
                                label: lang.helpExplainLabel,
                                id: "explain",
                                desc: lang.helpExplainDesc
                            }
                        ]
                    },
                    {
                        label: lang.helpMenuLabel,
                        desc: lang.helpMenuDesc
                    }
                ]
            },
            {
                label: lang.helpQueryStringSupportLabel,
                desc: format(lang.helpQueryStringSupportDesc, {example: queryExample.outerHTML})
            }
        ]
    }
];
