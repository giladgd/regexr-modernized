import {lang} from "../lang/language";
import {differences, type EditorState, type HistoryEntry} from "./HistoryEntry";
import {Patterns} from "./Patterns";
import {readFragment, readQuery, shareQuery} from "./ShareLink";
import type {RegExr} from "../RegExr";

export class EditorHistory {
    public active?: HistoryEntry;
    private baseline: EditorState;
    private readonly defaults: EditorState;
    private writing?: Promise<boolean>;
    private restoring = true;
    private route = 0;
    private traversing = false;
    private failed = false;
    private noticeTimer?: ReturnType<typeof setTimeout>;
    private shareRequest = 0;

    private app: RegExr;

    public constructor(app: RegExr) {
        this.app = app;
        this.defaults = this.baseline = app.state;
    }

    public async start() {
        const url = new URL(location.href);
        const params = url.searchParams;
        const id = params.get("local") || this.browserId();
        const fragment = url.hash.startsWith("#share=");
        const shared = fragment || (!id && params.has("expression") && !params.has("tool") && !params.has("input"));
        this.app.el.inert = true;
        try {
            if (shared) {
                const imported = fragment ? readFragment(url.hash) : readQuery(params, this.defaults);
                this.app.state = imported;
                this.adopt(await Patterns.create(this.record(this.app.state, imported.name)));
                this.location("replaceState");
            } else {
                this.adopt(id ? await Patterns.get(id) : undefined);
                if (params.has("local") || (id && !this.active)) {
                    this.location("replaceState");
                }
                if (params.size) {
                    this.app.state = readQuery(params, this.app.state);
                }
                this.baseline = this.app.state;
            }
        } catch {
            this.notify(shared ? lang.shareOpenFailed : lang.historyOpenFailed);
        } finally {
            this.restoring = false;
            this.app.el.inert = false;
        }
        document.querySelector<HTMLButtonElement>(".new")!.onclick = () => {
            void this.open();
        };
        const copy = document.querySelector<HTMLButtonElement>(".copy-link")!;
        copy.onclick = () => {
            void this.share(copy);
        };
        const dismissShare = () => {
            this.shareRequest++;
            this.app.tooltip.toggle.hide("share");
        };
        document.addEventListener("scroll", dismissShare, true);
        window.addEventListener("resize", dismissShare);
        window.addEventListener("popstate", () => {
            void this.open(this.browserId(), true);
        });
        window.addEventListener("focus", () => {
            void this.sync();
        });
        document.addEventListener("visibilitychange", () => {
            if (!document.hidden) {
                void this.sync();
            }
        });
        window.addEventListener("beforeunload", (event) => {
            if (this.writing || this.failed) {
                event.preventDefault();
                event.returnValue = "";
            }
        });
        this.app._change();
    }

    private browserId(): string | undefined {
        return typeof history.state?.id === "string" ? history.state.id : undefined;
    }

    private location(method: "pushState" | "replaceState") {
        history[method](this.active ? {id: this.active.id} : null, "", location.pathname);
    }

    private record(state: EditorState, name = ""): HistoryEntry {
        return {...state, id: crypto.getRandomValues(new Uint32Array(4)).join("-"), name, pinned: false, modifiedAt: 0};
    }

    private adopt(entry?: HistoryEntry, state: EditorState = entry ?? this.defaults) {
        const restoring = this.restoring;
        this.restoring = true;
        const before = this.app.state;
        this.active = entry;
        if (Object.keys(differences(before, state)).length) {
            this.app.state = state;
            this.app._change();
        }
        this.baseline = this.app.state;
        this.restoring = restoring;
        document.title = entry?.name || lang.pageTitle;
        void this.app.sidebar.history.refresh();
    }

    public edited() {
        if (!this.restoring && !this.failed) {
            void this.flush();
        }
    }

    private dirty(state: EditorState) {
        const changes = differences(this.baseline, state);
        if (!this.active) {
            delete changes.mode;
            delete changes.tool;
        }
        return Object.keys(changes).length > 0;
    }

    public flush(): Promise<boolean> {
        if (this.writing) {
            return this.writing;
        }
        if (!this.dirty(this.app.state)) {
            return Promise.resolve(true);
        }
        this.writing = this.save().catch(() => {
            this.failed = true;
            this.notify(lang.saveFailed, () => {
                void this.flush();
            });
            return false;
        })
            .finally(() => {
                this.writing = undefined;
            });
        return this.writing;
    }

    private async save() {
        while (this.dirty(this.app.state)) {
            const snapshot = this.app.state;
            let entry: HistoryEntry | undefined;
            if (this.active) {
                entry = await Patterns.update(this.active.id, differences(this.baseline, snapshot));
            } else {
                const draft = this.record(snapshot);
                history.replaceState({id: draft.id}, "");
                try {
                    entry = await Patterns.create(draft);
                } catch (error) {
                    if (this.browserId() === draft.id) {
                        history.replaceState(null, "");
                    }
                    throw error;
                }
                if (this.browserId() === draft.id) {
                    history.replaceState({id: draft.id}, "", location.pathname);
                }
            }
            const latest = this.app.state;
            if (!entry) {
                this.adopt(undefined, latest);
                this.baseline = this.defaults;
                if (!this.traversing) {
                    this.location("replaceState");
                }
                continue;
            }
            const pending = differences(snapshot, latest);
            this.adopt(entry, {...entry, ...pending});
            this.baseline = entry;
        }
        if (this.failed) {
            document.querySelector<HTMLElement>(".notice")!.hidden = true;
        }
        this.failed = false;
        return true;
    }

    public async open(id?: string, traversal = false) {
        const route = ++this.route;
        this.traversing = traversal;
        try {
            if (!await this.flush()) {
                if (traversal) {
                    this.location("pushState");
                }
                return;
            }
            if (route !== this.route) {
                return;
            }
            if (id && id === this.active?.id && !traversal) {
                if (this.app.isNarrow) {
                    this.app.sidebar.minimize(true);
                }
                return;
            }
            const newStep = !!id || !!this.active;
            const entry = id ? await Patterns.get(id) : undefined;
            if (!await this.flush() || route !== this.route) {
                return;
            }
            this.adopt(entry);
            this.app.expression.editor.clearHistory();
            this.app.text.editor.clearHistory();
            this.app.text.testEditor?.clearHistory();
            this.app.tools.editor.clearHistory();
            if (!traversal || (id && !entry)) {
                this.location(traversal || !newStep ? "replaceState" : "pushState");
            }
            if (this.app.isNarrow) {
                this.app.sidebar.minimize(true);
            }
        } catch {
            this.notify(lang.historyOpenFailed);
        } finally {
            if (this.route === route) {
                this.traversing = false;
            }
        }
    }

    public async sync() {
        const route = this.route;
        if (this.restoring || !await this.flush() || this.route !== route || this.traversing) {
            return;
        }
        const current = this.active;
        if (!current) {
            void this.app.sidebar.history.refresh();
            return;
        }
        try {
            const entry = await Patterns.get(current.id);
            if (route !== this.route || this.active !== current || this.writing || this.dirty(this.app.state)) {
                return;
            }
            if (!entry || entry.modifiedAt > current.modifiedAt) {
                this.adopt(entry);
                if (!entry) {
                    this.location("replaceState");
                }
            } else {
                current.pinned = entry.pinned;
                void this.app.sidebar.history.refresh();
            }
        } catch {
            this.notify(lang.refreshFailed);
        }
    }

    public async metadata(id: string, changes: {name: string} | {pinned: boolean}) {
        try {
            const entry = await Patterns.update(id, changes);
            if (entry && this.active?.id === id) {
                if ("name" in changes) {
                    await this.sync();
                    return;
                }
                this.active.pinned = entry.pinned;
            }
            await this.app.sidebar.history.refresh();
        } catch {
            this.notify(lang.updateFailed, () => {
                void this.metadata(id, changes);
            });
        }
    }

    public async remove(id: string) {
        if (!confirm(lang.deleteEntry) || !await this.flush()) {
            return;
        }
        try {
            await Patterns.delete(id);
            if (this.active?.id === id) {
                this.adopt();
                this.location("replaceState");
            } else {
                await this.app.sidebar.history.refresh();
            }
        } catch {
            this.notify(lang.deleteFailed);
        }
    }

    public async clear(scope: "all" | "unpinned") {
        const message = scope === "all" ? lang.confirmDeleteAll : lang.confirmDeleteUnpinned;
        if (!confirm(message) || !await this.flush()) {
            return;
        }
        try {
            await Patterns.clear(scope);
            await this.sync();
        } catch {
            this.notify(lang.clearFailed);
        }
    }

    public async share(anchor: HTMLElement, entry = this.active) {
        const snapshot = entry && entry.id !== this.active?.id ? entry : {...this.app.state, name: entry?.name ?? ""};
        const link = location.origin + location.pathname + "?" + shareQuery(snapshot, this.defaults);
        const request = ++this.shareRequest;
        const tooltip = this.app.tooltip.toggle, status = document.createElement("span");
        status.setAttribute("role", "status");
        tooltip.hide();
        let manual: HTMLAnchorElement | undefined;
        try {
            await navigator.clipboard.writeText(link);
            status.textContent = lang.linkCopied;
        } catch {
            manual = document.createElement("a");
            manual.href = link;
            manual.textContent = lang.shareLink;
            const [before, after] = lang.manualCopy.split("{{link}}");
            status.append(before, manual, after);
        }
        if (request !== this.shareRequest || tooltip.curId || !anchor.checkVisibility() || anchor.closest("[inert]")) {
            return;
        }
        tooltip.showOn("share", status, anchor, true);
        const previousFocus = document.activeElement;
        manual?.focus({preventScroll: true});
        setTimeout(() => {
            if (!status.isConnected) {
                return;
            }
            if (document.activeElement === manual && previousFocus instanceof HTMLElement) {
                previousFocus.focus({preventScroll: true});
            }
            tooltip.hide("share");
        }, 2000);
    }

    public notify(message: string, retry?: () => void) {
        const notice = document.querySelector<HTMLElement>(".notice")!;
        notice.hidden = false;
        notice.querySelector("span")!.textContent = message;
        const button = notice.querySelector("button")!;
        button.hidden = !retry;
        button.onclick = retry ?? null;
        clearTimeout(this.noticeTimer);
        if (!retry) {
            this.noticeTimer = setTimeout(() => {
                notice.hidden = true;
            }, 4000);
        }
    }
}
