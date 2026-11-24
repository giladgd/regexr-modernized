import {solve} from "./solve";
import type {SolveRequest} from "../types";

self.onmessage = (event: MessageEvent<SolveRequest>) => {
    self.postMessage("onload");
    self.postMessage(solve(event.data));
};
