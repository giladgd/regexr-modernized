import {lang, language} from "../lang/language";
import {app} from "../app";
import {highlightRegex} from "../regexMode";
import {Patterns} from "../helpers/Patterns";
import {UID} from "../utils/UID";
import type {HistoryEntry} from "../helpers/HistoryEntry";

const relativeTime = new Intl.RelativeTimeFormat(language.id, {style: "narrow"});
const timeUnits = [
    ["year", 365 * 86400], ["month", 30 * 86400], ["week", 7 * 86400],
    ["day", 86400], ["hour", 3600], ["minute", 60]
] as const;

function modified(time: number, now: number) {
    if (!time) {
        return lang.imported;
    }
    const seconds = Math.max(0, Math.floor((now - time) / 1000));
    for (const [unit, length] of timeUnits) {
        if (seconds >= length) {
            return relativeTime.format(-Math.floor(seconds / length), unit);
        }
    }
    return relativeTime.format(-seconds, "second");
}

function iconButton(icon: string, label: string) {
    const button = document.createElement("button");
    button.className = "icon-button";
    button.setAttribute("aria-label", label);
    button.title = label;
    button.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#' + icon + '"></use></svg>';
    return button;
}

function actionMenu(trigger: HTMLButtonElement, id: string, actions: {label: string, icon: string, run: () => void}[]) {
    trigger.ariaExpanded = "false";
    const close = () => {
        app.tooltip.toggle.hide(id);
        trigger.focus({preventScroll: true});
    };
    const onKey = (event: KeyboardEvent) => {
        if (event.key === "Escape" && app.tooltip.toggle.toggleEl === trigger) {
            close();
        }
    };
    trigger.onkeydown = onKey;
    trigger.onclick = (event) => {
        const menu = document.createElement("div");
        menu.className = "action-menu";
        menu.onkeydown = onKey;
        for (const action of actions) {
            const button = document.createElement("button");
            button.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#' + action.icon + '"></use></svg>' + action.label;
            button.onclick = () => {
                close();
                action.run();
            };
            menu.append(button);
        }
        app.tooltip.toggle.toggleOn(id, menu, trigger, true);
        if (event.detail === 0 && menu.isConnected) {
            menu.querySelector("button")!.focus();
        }
    };
}

export class HistoryList {
    private request = 0;
    private entries: HistoryEntry[] = [];
    private pinned = document.createElement("section");
    private recent = document.createElement("section");

    private el: HTMLElement;

    public constructor(el: HTMLElement, options: HTMLButtonElement) {
        this.el = el;
        actionMenu(options, "history-options", [
            {label: lang.deleteAll, icon: "delete", run: () => {
                void app.history.clear("all");
            }},
            {label: lang.deleteNonPinned, icon: "delete", run: () => {
                void app.history.clear("unpinned");
            }}
        ]);
        this.pinned.className = "pinned";
        this.pinned.setAttribute("aria-label", lang.pinned);
        el.append(this.pinned, this.recent);
        setInterval(() => {
            if (!document.hidden && this.el.closest(".sidebar:not([inert])")) {
                this.updateTimes();
            }
        }, 1000);
    }

    public async refresh() {
        if (!this.el.closest(".sidebar")) {
            return;
        }
        const request = ++this.request;
        try {
            const entries = await Patterns.list();
            if (request !== this.request) {
                return;
            }
            this.entries = entries;
            this.render(this.pinned, entries.filter((entry) => entry.pinned));
            this.render(this.recent, entries);
            this.el.querySelector(".empty")?.remove();
            if (!entries.length) {
                const empty = document.createElement("p");
                empty.className = "empty";
                empty.textContent = lang.emptyHistory;
                this.el.append(empty);
            }
            this.updateTimes();
        } catch {
            app.history?.notify(lang.historyLoadFailed);
        }
    }

    private render(section: HTMLElement, entries: HistoryEntry[]) {
        section.hidden = !entries.length;
        const rows = new Map(Array.from(section.querySelectorAll<HTMLElement>(".entry"), (row) => [row.dataset.id, row]));
        let next = section.querySelector(".entry");
        for (const entry of entries) {
            const row = rows.get(entry.id) ?? this.row(entry.id);
            rows.delete(entry.id);
            row.classList.toggle("active", entry.id === app.history?.active?.id);
            row.querySelector(".open-entry")!.setAttribute("aria-current", String(row.classList.contains("active")));
            const time = row.querySelector("time")!;
            if (time.dataset.time !== String(entry.modifiedAt)) {
                time.dataset.time = String(entry.modifiedAt);
                if (entry.modifiedAt) {
                    const date = new Date(entry.modifiedAt);
                    time.dateTime = date.toISOString();
                    time.title = date.toLocaleString(language.id);
                }
            }
            const pin = row.querySelector("button.pin")!;
            pin.setAttribute("aria-pressed", String(entry.pinned));
            pin.setAttribute("aria-label", entry.pinned ? lang.unpin : lang.pin);
            pin.setAttribute("title", entry.pinned ? lang.unpin : lang.pin);
            const name = row.querySelector<HTMLElement>(".entry-name")!;
            name.textContent = entry.name;
            name.hidden = !entry.name;
            const code = row.querySelector("code")!;
            code.hidden = !!entry.name;
            if (!entry.name && code.textContent !== entry.expression) {
                highlightRegex(code, entry.expression);
            }
            if (row.contains(document.activeElement)) {
                const after = row.nextElementSibling;
                while (next && next !== row) {
                    const move = next;
                    next = move.nextElementSibling;
                    section.insertBefore(move, after);
                }
            } else if (next !== row) {
                section.insertBefore(row, next);
            }
            next = row.nextElementSibling;
        }
        rows.forEach((row) => row.remove());
    }

    private row(id: string) {
        const row = document.createElement("div");
        row.className = "entry";
        row.dataset.id = id;
        const open = document.createElement("button");
        open.className = "open-entry";
        open.innerHTML = '<span class="entry-name"></span><code></code>';
        const time = document.createElement("time");
        time.id = "history-time-" + UID.id;
        open.setAttribute("aria-describedby", time.id);
        time.onclick = open.onclick = () => {
            void app.history.open(id);
        };
        const find = () => this.entries.find((entry) => entry.id === id)!;
        const pin = iconButton("pin", lang.pin);
        pin.classList.add("pin");
        pin.onclick = () => {
            void app.history.metadata(id, {pinned: !find().pinned});
        };
        const more = iconButton("more", lang.entryOptions);
        actionMenu(more, "entry-" + id, [
            {label: lang.copyLink, icon: "share", run: () => {
                const entry = find();
                if (entry) {
                    void app.history.share(row, entry);
                }
            }},
            {label: lang.rename, icon: "edit", run: () => this.rename(row, find())},
            {label: lang.delete, icon: "delete", run: () => {
                void app.history.remove(id);
            }}
        ]);
        row.append(open, time, more, pin);
        return row;
    }

    private rename(row: HTMLElement, entry: HistoryEntry) {
        const input = document.createElement("input");
        const open = row.querySelector<HTMLButtonElement>(".open-entry")!;
        input.className = "entry-edit";
        input.value = entry.name;
        input.placeholder = entry.expression;
        input.setAttribute("aria-label", lang.entryName);
        open.before(input);
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
        input.oninput = () => {
            void app.history.metadata(entry.id, {name: input.value});
        };
        input.onblur = () => {
            input.remove();
            void this.refresh();
        };
        input.onkeydown = (event) => {
            if (!event.isComposing && (event.key === "Enter" || event.key === "Escape")) {
                event.preventDefault();
                input.blur();
                open.focus();
            }
        };
    }

    private updateTimes() {
        const now = Date.now();
        for (const time of this.el.querySelectorAll("time")) {
            const label = modified(Number(time.dataset.time), now);
            if (time.textContent !== label) {
                time.textContent = label;
            }
        }
    }
}
