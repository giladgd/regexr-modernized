import "@fontsource-variable/inter";
import "@fontsource-variable/source-code-pro";
import "codemirror/lib/codemirror.css";
import "./css/regexr.css";
import {app} from "./app";
import {lang} from "./lang/language";
import {CMUtils} from "./utils/CMUtils";

const primaryFinePointer = matchMedia("(hover: hover) and (pointer: fine)");
const anyFinePointer = matchMedia("(any-hover: hover) and (any-pointer: fine)");
let pointerType: string | undefined;
function updatePointer(event?: PointerEvent) {
    if (event) {
        if (event.pointerType === pointerType) {
            return;
        }
        pointerType = event.pointerType;
    }
    const fine = pointerType === undefined
        ? primaryFinePointer.matches
        : anyFinePointer.matches && (pointerType === "mouse" || pointerType === "pen");
    document.documentElement.classList.toggle("fine-pointer", fine);
}
updatePointer();
primaryFinePointer.addEventListener("change", () => updatePointer());
anyFinePointer.addEventListener("change", () => updatePointer());
window.addEventListener("pointerdown", updatePointer, true);
window.addEventListener("pointermove", updatePointer, true);

const scrollbarProbe = document.querySelector<HTMLElement>("#scrollbar-probe")!;
function updateScrollbarStyle() {
    const classic = scrollbarProbe.offsetWidth > scrollbarProbe.clientWidth;
    const classes = document.documentElement.classList;
    if (classes.contains("classic-scrollbars") === classic) {
        return;
    }
    classes.toggle("classic-scrollbars", classic);
    for (const editor of [app.expression?.editor, app.text?.editor, app.text?.testEditor, app.tools?.editor]) {
        if (editor) {
            CMUtils.refreshScrollbars(editor);
        }
    }
}
updateScrollbarStyle();
new ResizeObserver(updateScrollbarStyle).observe(scrollbarProbe);

void app.init();

const header = document.querySelector<HTMLElement>(".header")!;
const brand = header.querySelector<HTMLElement>(".brand")!;
const actions = header.querySelector<HTMLElement>(".brand + .header-actions")!;
const label = brand.querySelector<HTMLElement>(".modernized")!;
const wording = document.createElement("span");
wording.textContent = lang.modernized.slice(1, -1);
label.replaceChildren(lang.modernized[0], wording, lang.modernized.slice(-1));

function sizeBrandLabel() {
    const space = actions.getBoundingClientRect().left - brand.getBoundingClientRect().right;
    const compact = matchMedia("(max-width: 30rem)").matches;
    const minimum = 3 * parseFloat(getComputedStyle(brand).fontSize);
    brand.style.setProperty("--label-space", space + "px");
    brand.classList.toggle("label-below", compact || space < minimum);
}
sizeBrandLabel();
const headerResize = new ResizeObserver(sizeBrandLabel);
for (const element of [header, brand, actions]) {
    headerResize.observe(element);
}

window.addEventListener("load", () => {
    window.setTimeout(() => {
        brand.classList.remove("intro");
        if (!brand.matches(".fine-pointer :hover")) {
            brand.classList.add("intro-fade");
            brand.addEventListener("pointerenter", () => brand.classList.remove("intro-fade"), {once: true});
        }
    }, 250);
});
