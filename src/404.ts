import {Prefs} from "./helpers/Prefs";

const dark = new Prefs().read("dark");
if (dark !== undefined) {
    document.documentElement.classList.add(dark ? "dark" : "light");
}
