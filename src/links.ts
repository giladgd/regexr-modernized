import pkg from "../package.json" with {type: "json"};
import type {LangTexts} from "./lang/LangTexts";

export const repositoryUrl = pkg.repository.url.replace(/^git\+|\.git$/g, "");
export const feedbackUrl = pkg.bugs.url;

const links = {
    modernizerProfileLink: {href: "https://github.com/giladgd", fixedLabel: "giladgd"},
    modernizerLink: {href: "https://x.com/giladgd", label: "modernizerName"},
    originalAuthorLink: {href: "http://twitter.com/gskinner/", label: "originalAuthorName"},
    originalTeamLink: {href: "http://gskinner.com", fixedLabel: "gskinner"},
    createJsLink: {href: "http://createjs.com/", fixedLabel: "CreateJS"},
    codeMirrorLink: {href: "http://codemirror.net/", fixedLabel: "CodeMirror"},
    unicodeDocsLink: {href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Unicode_Property_Escapes", label: "unicodeDocsLabel"}
} as const;

export function renderLinks(template: string, texts: LangTexts, newTab = false) {
    return template.replace(/{{(\w+Link)}}/g, (placeholder, key: string) => {
        if (!Object.hasOwn(links, key)) {
            return placeholder;
        }
        const link = links[key as keyof typeof links];
        const fixed = "fixedLabel" in link;
        const label = fixed ? link.fixedLabel : texts[link.label];
        const text = label.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
        return '<a href="' + link.href + '"' + (fixed ? ' translate="no"' : "") + (newTab ? ' target="_blank" rel="noopener"' : "") + ">" + text + "</a>";
    });
}
