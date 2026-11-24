import {mergeEntry, migratePattern, type EntryChanges, type HistoryEntry} from "./HistoryEntry";
import type {SavedPattern} from "../types";

let connection: Promise<IDBDatabase> | undefined;

function open(): Promise<IDBDatabase> {
    connection ??= new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("regexr", 2);
        request.onupgradeneeded = (event) => {
            if (!event.oldVersion) {
                request.result.createObjectStore("patterns", {keyPath: "id"});
                return;
            }
            const cursor = request.transaction!.objectStore("patterns").openCursor();
            cursor.onsuccess = () => {
                if (!cursor.result) {
                    return;
                }
                cursor.result.update(migratePattern(cursor.result.value as SavedPattern));
                cursor.result.continue();
            };
        };
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            db.onversionchange = () => {
                db.close();
                connection = undefined;
            };
            resolve(db);
        };
    }).catch((error) => {
        connection = undefined;
        throw error;
    });
    return connection;
}

async function transaction<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => () => T): Promise<T> {
    const db = await open();
    return new Promise((resolve, reject) => {
        const tx = db.transaction("patterns", mode);
        const result = run(tx.objectStore("patterns"));
        tx.oncomplete = () => resolve(result());
        tx.onabort = () => reject(tx.error || new Error("History transaction aborted"));
    });
}

export const Patterns = {
    list: () => transaction("readonly", (store) => {
        const request: IDBRequest<HistoryEntry[]> = store.getAll();
        return () => request.result.sort((a, b) => b.modifiedAt - a.modifiedAt);
    }),
    get: (id: string) => transaction("readonly", (store) => {
        const request: IDBRequest<HistoryEntry | undefined> = store.get(id);
        return () => request.result;
    }),
    create: (entry: HistoryEntry) => transaction("readwrite", (store) => {
        const saved = mergeEntry(entry, {});
        store.add(saved);
        return () => saved;
    }),
    update: (id: string, changes: EntryChanges) => transaction("readwrite", (store) => {
        const request: IDBRequest<HistoryEntry | undefined> = store.get(id);
        let saved: HistoryEntry | undefined;
        request.onsuccess = () => {
            if (!request.result) {
                return;
            }
            saved = mergeEntry(request.result, changes);
            store.put(saved);
        };
        return () => saved;
    }),
    delete: (id: string) => transaction("readwrite", (store) => {
        store.delete(id);
        return () => {};
    }),
    clear: (scope: "all" | "unpinned") => transaction("readwrite", (store) => {
        if (scope === "all") {
            store.clear();
        } else {
            const request = store.openCursor();
            request.onsuccess = () => {
                const cursor = request.result;
                if (!cursor) {
                    return;
                }
                if (!(cursor.value as HistoryEntry).pinned) {
                    cursor.delete();
                }
                cursor.continue();
            };
        }
        return () => {};
    })
};
