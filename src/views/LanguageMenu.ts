import {language, languages, preference, prefs, resolveLanguage} from "../lang/language";
import type {EditorHistory} from "../helpers/EditorHistory";
import type {Language} from "../lang/languages";

export function initLanguageMenu(history: EditorHistory) {
    const options = document.querySelector<HTMLElement>("#app-options")!;
    const picker = options.querySelector<HTMLElement>(".language-picker")!;
    const trigger = picker.querySelector<HTMLButtonElement>(".language-toggle")!;
    const submenu = picker.querySelector<HTMLElement>(".language-submenu")!;
    const scrollArea = submenu.querySelector<HTMLElement>(".language-scroll")!;
    const menu = picker.querySelector<HTMLElement>("#language-options")!;
    const scrollDown = picker.querySelector<HTMLButtonElement>(".scroll-down")!;
    const shortcut = document.querySelector<HTMLButtonElement>(".english-shortcut")!;
    const visit = new AbortController();
    let closeTimer: number | undefined;

    function updateScrollButton() {
        if (submenu.hidden) {
            return;
        }
        const atBottom = scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight <= 1;
        if (atBottom && document.activeElement === scrollDown) {
            menu.querySelector<HTMLButtonElement>("button:last-child")!.focus({preventScroll: true});
        }
        scrollDown.hidden = atBottom;
    }

    function open(show: boolean) {
        clearTimeout(closeTimer);
        submenu.hidden = !show;
        trigger.setAttribute("aria-expanded", String(show));
        if (show) {
            updateScrollButton();
        }
    }

    function closeUnlessFocused() {
        if (!submenu.contains(document.activeElement)) {
            open(false);
        }
    }

    async function select(id: string) {
        if (id !== language.id && !await history.flush()) {
            return;
        }
        visit.abort();
        shortcut.hidden = true;
        const saved = prefs.write("language", id);
        options.hidePopover();
        if (id !== language.id) {
            if (!saved) {
                window.history.replaceState({...window.history.state, language: id}, "");
            }
            location.reload();
        }
    }

    function addOption(option: Language, pinned = false) {
        const button = document.createElement("button");
        button.type = "button";
        button.lang = option.id;
        button.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#check"></use></svg>';
        button.append(option.name);
        button.setAttribute("aria-pressed", String(option.id === language.id));
        button.addEventListener("click", () => {
            void select(option.id);
        });
        menu.append(button);
        if (pinned) {
            menu.append(document.createElement("hr"));
        }
    }

    const detected = resolveLanguage(languages, undefined, navigator.languages);
    if (detected.id.split("-")[0] !== "en") {
        addOption(detected, true);
    }
    addOption(languages[0], true);
    const englishNames = new Intl.DisplayNames("en", {type: "language"});
    const sorted = languages.map((option) => ({option, name: englishNames.of(option.id) || option.id}));
    sorted.sort((a, b) => a.name.localeCompare(b.name, "en"));
    for (const {option} of sorted) {
        addOption(option);
    }

    const rows = Array.from(menu.querySelectorAll("button"));
    scrollDown.addEventListener("click", () => {
        const top = scrollArea.getBoundingClientRect().top;
        const first = rows.findIndex((row) => row.getBoundingClientRect().bottom > top);
        const current = rows[first], next = rows[first + 4];
        const distance = current && next ? next.getBoundingClientRect().top - current.getBoundingClientRect().top : scrollArea.scrollHeight;
        scrollArea.scrollBy({top: distance});
    });
    scrollArea.addEventListener("scroll", updateScrollButton);
    new ResizeObserver(updateScrollButton).observe(scrollArea);

    trigger.addEventListener("click", (event) => open(submenu.hidden || event.pointerType === "mouse"));
    picker.addEventListener("pointerenter", (event) => {
        if (event.pointerType !== "touch" && document.documentElement.classList.contains("fine-pointer")) {
            open(true);
        }
    });
    picker.addEventListener("pointerleave", (event) => {
        if (submenu.hidden || event.pointerType === "touch") {
            return;
        }
        if (event.relatedTarget instanceof Node && options.contains(event.relatedTarget)) {
            closeTimer = window.setTimeout(closeUnlessFocused, 300);
        } else {
            closeUnlessFocused();
        }
    });
    picker.addEventListener("focusout", (event) => {
        if (!(event.relatedTarget instanceof Node && picker.contains(event.relatedTarget))) {
            open(false);
        }
    });
    picker.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight" || (event.target === trigger && event.key === "ArrowDown")) {
            event.preventDefault();
            open(true);
            menu.querySelector("button")!.focus();
        } else if (!submenu.hidden && (event.key === "ArrowLeft" || event.key === "Escape")) {
            event.preventDefault();
            event.stopPropagation();
            open(false);
            trigger.focus();
        }
    });
    options.addEventListener("beforetoggle", (event) => {
        if (event.newState === "closed") {
            open(false);
        }
    });

    if (preference === "auto" || languages.some((option) => option.id === preference)) {
        return;
    }
    if (language.id.split("-")[0] !== "en") {
        shortcut.hidden = false;
        shortcut.addEventListener("click", () => {
            void select("en");
        });
        const fade = window.setTimeout(() => {
            shortcut.inert = true;
            shortcut.classList.add("fading");
            Promise.allSettled(shortcut.getAnimations().map((animation) => animation.finished))
                .then(() => {
                    shortcut.hidden = true;
                });
        }, 10000);
        visit.signal.addEventListener("abort", () => clearTimeout(fade));
    }

    let edited = false, remaining = 180000;
    let started: number | undefined, timer: number | undefined;
    function accept() {
        if (edited && remaining <= 0) {
            const current = prefs.read("language");
            if (!languages.some((option) => option.id === current)) {
                prefs.write("language", "auto");
            }
            visit.abort();
        }
    }
    function visibility() {
        if (started !== undefined) {
            remaining -= performance.now() - started;
        }
        clearTimeout(timer);
        started = document.hidden ? undefined : performance.now();
        if (started !== undefined && remaining > 0) {
            timer = window.setTimeout(() => {
                remaining = 0;
                accept();
            }, remaining);
        }
        accept();
    }
    document.addEventListener("input", (event) => {
        if (event.isTrusted && event.target instanceof Element && event.target.closest("input, textarea, [contenteditable=true]")) {
            edited = true;
            accept();
        }
    }, {signal: visit.signal});
    document.addEventListener("visibilitychange", visibility, {signal: visit.signal});
    visit.signal.addEventListener("abort", () => clearTimeout(timer));
    visibility();
}
