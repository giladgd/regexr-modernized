import {lang} from "../lang/language";
import {EventDispatcher} from "../events/EventDispatcher";
import {Prefs} from "../helpers/Prefs";

export class Theme extends EventDispatcher {
    public constructor(el: HTMLElement, prefs: Prefs, scheme: MediaQueryList) {
        super();
        const button = el.querySelector<HTMLElement>("#app-options .theme")!;
        const label = button.querySelector("span")!, icon = button.querySelector("use")!;
        const themeTags = Array.from(document.head.querySelectorAll<HTMLLinkElement | HTMLMetaElement>('link[rel="icon"], meta[name="theme-color"]'),
            (tag) => ({tag, forDark: tag.media === scheme.media}));
        const apply = () => {
            const dark = prefs.read("dark") ?? scheme.matches;
            document.documentElement.classList.toggle("dark", dark);
            for (const {tag, forDark} of themeTags) {
                if (forDark === dark) {
                    tag.removeAttribute("media");
                    if (!tag.isConnected) {
                        document.head.append(tag);
                    }
                } else {
                    tag.remove();
                }
            }
            label.textContent = dark ? lang.switchToLightTheme : lang.switchToDarkTheme;
            icon.setAttribute("href", dark ? "#sun" : "#moon");
            this.dispatchEvent("change");
        };
        button.addEventListener("click", () => {
            prefs.write("dark", !document.documentElement.classList.contains("dark"));
            apply();
        });
        scheme.addEventListener("change", apply);
        apply();
    }
}
