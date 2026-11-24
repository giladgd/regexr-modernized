import {renderLinks} from "../links";
import {Prefs} from "../helpers/Prefs";
import {enLang} from "./en";
import {languages, type Language} from "./languages";
import type {LangKey, LangTexts} from "./LangTexts";

export {languages};

export function resolveLanguage(available: readonly Language[], preference: string | undefined, requested: readonly string[]) {
    const explicit = available.find((option) => option.id === preference);
    if (explicit) {
        return explicit;
    }
    for (const locale of requested) {
        let script: string | undefined;
        try {
            script = new Intl.Locale(locale).maximize().script;
        } catch {
            continue;
        }
        let tag = locale.toLowerCase();
        while (tag) {
            const option = available.find((option) => option.id.toLowerCase() === tag) ||
                (tag === "no" && available.find((option) => option.id === "nb"));
            if (option && new Intl.Locale(option.id).maximize().script === script) {
                return option;
            }
            const end = tag.lastIndexOf("-");
            tag = end < 0 ? "" : tag.slice(0, end);
        }
    }
    return available[0];
}

export const prefs = new Prefs();
const transientLanguage = typeof history !== "undefined" && history.state?.language;
export const preference = typeof transientLanguage === "string" ? transientLanguage : prefs.read("language");
export async function loadLanguage(option: Language) {
    try {
        const texts = await option.load();
        if (texts) {
            return {id: option.id, texts};
        }
    } catch {}
    return {id: "en", texts: enLang};
}

const selected = resolveLanguage(languages, preference, navigator.languages);
export const language = selected.id === "en" ? {id: "en", texts: enLang} : await loadLanguage(selected);
export const lang: LangTexts = language.texts;

export function format(template: string, params: Record<string, string | number>) {
    return template.replace(/{{(\w+)}}/g, (match, key: string) => (Object.hasOwn(params, key) ? String(params[key]) : match));
}

const textAttributes = ["aria-label", "title", "placeholder", "content"] as const;

export function localizePage() {
    document.documentElement.lang = language.id;
    if (language.id === "en") {
        return;
    }
    for (const element of document.querySelectorAll<HTMLElement>("[data-lang]")) {
        const key = element.dataset.lang as LangKey;
        element.innerHTML = key === "switchToEnglish" ? enLang[key] : renderLinks(lang[key], lang);
    }
    for (const attr of textAttributes) {
        for (const element of document.querySelectorAll("[data-lang-" + attr + "]")) {
            element.setAttribute(attr, lang[element.getAttribute("data-lang-" + attr) as LangKey]);
        }
    }
}
