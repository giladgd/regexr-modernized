import {enLang} from "./en";
import type {LangTexts} from "./LangTexts";

export type Language = {id: string, name: string, load: () => Promise<LangTexts>};

const catalogs = import.meta.glob<LangTexts>(["./??.ts", "./???.ts", "./??-*.ts", "./???-*.ts", "!./en.ts"], {import: "texts"});

export const languages: readonly Language[] = [
    {id: "en", name: enLang.languageName, load: async () => enLang},
    ...Object.entries(catalogs).map(([file, load]) => {
        const id = file.slice(2, -3);
        const name = new Intl.DisplayNames([id], {type: "language"}).of(id) || id;
        return {id, name, load};
    })
];
