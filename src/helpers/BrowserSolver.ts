import {lang} from "../lang/language";
import {solve} from "./solve";
import type {SolveRequest, SolveResult} from "../types";

export class BrowserSolver {
    private worker?: Worker;
    private timeout?: ReturnType<typeof setTimeout>;

    public solve(request: SolveRequest, callback: (result: SolveResult) => void) {
        clearTimeout(this.timeout);
        this.worker?.terminate();
        if (!window.Worker) {
            callback(solve(request));
            return;
        }

        const worker = this.worker = new Worker(new URL("./RegExWorker.ts", import.meta.url), {type: "module"});
        const finish = (result: SolveResult) => {
            if (worker !== this.worker) {
                return;
            }
            clearTimeout(this.timeout);
            worker.terminate();
            this.worker = undefined;
            callback(result);
        };
        worker.onmessage = (evt: MessageEvent<"onload" | SolveResult>) => {
            if (worker !== this.worker) {
                return;
            }
            if (evt.data === "onload") {
                this.timeout = setTimeout(() => finish({mode: request.mode, matches: [], time: null, error: {id: "timeout"}}), 250);
            } else {
                finish(evt.data);
            }
        };
        worker.onerror = () => finish({mode: request.mode, matches: [], time: null, error: {id: "regexparse", message: lang.unableToRun}});
        worker.postMessage(request);
    }
}
