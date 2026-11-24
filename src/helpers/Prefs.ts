type Preferences = {dark?: boolean, side?: string, language?: string};

function parse(raw: string): Preferences {
    const data = JSON.parse(raw);
    const prefs: Preferences = {};
    if (typeof data?.dark === "boolean") {
        prefs.dark = data.dark;
    }
    if (typeof data?.side === "string") {
        prefs.side = data.side;
    }
    if (typeof data?.language === "string") {
        prefs.language = data.language;
    }
    return prefs;
}

export class Prefs {
    private data: Preferences = {};

    public constructor() {
        try {
            const saved = window.localStorage.getItem("regexr.prefs");
            if (saved !== null) {
                this.data = parse(saved);
            } else {
                const legacy = /(?:^|;\s*)prefs=([^;]+)/.exec(document.cookie);
                if (legacy) {
                    this.data = parse(unescape(legacy[1]));
                    window.localStorage.setItem("regexr.prefs", JSON.stringify(this.data));
                    document.cookie = "prefs=; Max-Age=0; path=/";
                }
            }
        } catch {}
    }

    public read<K extends keyof Preferences>(key: K) {
        try {
            const saved = window.localStorage.getItem("regexr.prefs");
            if (saved !== null) {
                this.data = parse(saved);
            }
        } catch {}
        return this.data[key];
    }

    public write<K extends keyof Preferences>(key: K, value: Preferences[K]) {
        this.read(key);
        this.data[key] = value;
        try {
            window.localStorage.setItem("regexr.prefs", JSON.stringify(this.data));
            return true;
        } catch {
            return false;
        }
    }
}
